# RxBetter Architecture Refinement - Library -> Plan -> Execution -> History

## Overview
This architecture supports the complete fitness coaching workflow with segmented programming (Weightlifting, Metcon, Skill, Bodyweight), athlete-specific execution tracking, and performance history management.

## Object Schema

### 1. Programming_Type__c (Library - Movement Definitions)
**Purpose**: Central repository of all movements/benchmarks
- **Name**: Movement name (e.g., 'Back Squat', 'Fran')
- **Stimulus__c** (Picklist): 'Strength', 'Metcon', 'Skill'

---

### 2. Programming__c (Plan - Daily Workout Block)
**Purpose**: Represents a daily workout block assigned to a gym/coach
**Relations**: Lookup to Account (Gym)

**New Fields**:
- **Date__c**: The date of the programming
- **Programming_Segment__c** (Picklist): 'Weightlifting', 'Metcon', 'Skill', 'Bodyweight'
- **Total_Sets__c** (Roll-up Summary): COUNT of Programming_Line_Item__c records
- **Is_Completed__c** (Checkbox): Marked TRUE when athletes complete all sets

---

### 3. Programming_Line_Item__c (Execution - Individual Set)
**Purpose**: Individual set/rep scheme within a programming block
**Relations**: Master-Detail to Programming__c, Lookup to Programming_Type__c, Lookup to Contact

**New Fields**:
- **Assigned Athlete (Contact__c)**: Which athlete this line item applies to (optional for bulk assignments)
- **Sequence_Number__c**: Order (1, 2, 3...)
- **Reps_Prescribed__c**: Number of repetitions
- **Prescribed_Percentage__c** (Percent): % of PR the coach wants (e.g., 85%)
- **Athlete_Current_PR__c** (Number): The athlete's max weight for this movement (calculated/queried)
- **Prescribed_Weight__c** (Formula/Number): Athlete_Current_PR__c × Prescribed_Percentage__c
- **Status__c** (Picklist): 'Pending', 'Completed', 'Failed' (default: Pending)
- **Actual_Weight_Lifted__c** (Number): What the athlete actually used
- **Prescribed_Score__c**: For Metcon/non-weightlifting (e.g., '5:32')

---

### 4. Athlete_Performance__c (History - Performance Ledger)
**Purpose**: Complete record of every athlete's performance on every movement
**Relations**: Master-Detail to Contact (Athlete), Lookup to Programming_Type__c

**New Fields**:
- **Contact__c** (Master-Detail): The athlete
- **Programming_Type__c** (Lookup): The movement performed
- **Performance_Date__c** (Date): When the performance occurred
- **Result_Value__c** (Number): Weight, time, or reps achieved
- **Is_New_PR__c** (Checkbox): TRUE if this exceeds the athlete's previous best

**Note**: Sharing is ControlledByParent → inherited from Contact

---

## Automation

### ProgrammingLineItemCompletionTrigger (After Update)
**Purpose**: Automatically creates Athlete_Performance__c records when an athlete marks a set as complete

**Logic Flow**:
1. **Trigger Event**: Status__c changes to 'Completed' on Programming_Line_Item__c
2. **Query**: Fetch Programming__c date
3. **Check PR**: Query Athlete_Performance__c to find the athlete's previous max for that movement
4. **Create Record**: Insert new Athlete_Performance__c with:
   - Contact__c = Programming_Line_Item__c.Contact__c
   - Programming_Type__c = Programming_Line_Item__c.Movement__c
   - Performance_Date__c = Programming__c.Date__c (or TODAY if not set)
   - Result_Value__c = Programming_Line_Item__c.Actual_Weight_Lifted__c
   - Is_New_PR__c = TRUE if Result_Value__c > previous max

**Requirements**:
- Contact__c must be populated on Programming_Line_Item__c
- Movement__c must be populated
- Actual_Weight_Lifted__c should be populated before status changes to 'Completed'

---

## Workflow Example: Weightlifting Segment

1. **Coach Creates Programming**
   - Creates Programming__c for 2026-03-10
   - Sets Programming_Segment__c = 'Weightlifting'
   
2. **Coach Assigns Movements** 
   - Creates 3 Programming_Line_Item__c records under Programming__c
   - Set 1: Back Squat, 3 reps, 85% (Sequence 1)
   - Set 2: Back Squat, 2 reps, 90% (Sequence 2)
   - Set 3: Back Squat, 1 rep, 95% (Sequence 3)
   - Assigns all to Athlete 'John Doe' (Contact)

3. **Athlete Logs In**
   - Views their Programming for the day via LWC or app
   - Sees:
     - Set 1: Back Squat 85% = 318 lbs (if PR is 375)
     - Set 2: Back Squat 90% = 337 lbs
     - Set 3: Back Squat 95% = 356 lbs

4. **Athlete Completes Sets**
   - Logs weight for Set 1: 325 lbs, marks Status = 'Completed'
   - **Trigger fires**: Creates Athlete_Performance__c (225 lbs → not PR)
   - Logs weight for Set 3: 375 lbs, marks Status = 'Completed'
   - **Trigger fires**: Creates Athlete_Performance__c (375 lbs → IS NEW PR ✓)

5. **History Updated**
   - Athlete_Performance__c records now show performance trend
   - Coaches can query: "What are John's PRs?" → aggregate max Result_Value__c

---

## Implementation Notes

### Athlete_Current_PR__c Calculation
The formula is set as a Number field. To calculate at a UI level:
```
SELECT MAX(Result_Value__c) FROM Athlete_Performance__c 
WHERE Contact__c = [AthleteId] AND Programming_Type__c = [MovementId]
```

### Setting Athlete_Current_PR__c and Prescribed_Weight__c
These can be:
1. **Flow-based**: Use Flows to query and populate before Status change
2. **LWC-based**: Calculate in JavaScript before displaying
3. **Batch process**: Nightly batch updates

Recommend: LWC calculation for real-time accuracy.

### PR Determination
Is_New_PR__c is set by trigger logic:
- TRUE if Result_Value__c > MAX(previous Result_Value__c for that athlete+movement)
- FALSE if this is the first attempt or not higher than previous

---

## Query Examples

**Get an athlete's PRs by movement:**
```sql
SELECT Programming_Type__c, MAX(Result_Value__c) AS PersonalRecord
FROM Athlete_Performance__c
WHERE Contact__c = [AthleteId]
GROUP BY Programming_Type__c
```

**Get all new PRs from today:**
```sql
SELECT Contact__r.Name, Programming_Type__r.Name, Result_Value__c
FROM Athlete_Performance__c
WHERE Performance_Date__c = TODAY AND Is_New_PR__c = TRUE
```

**Get incomplete programming blocks:**
```sql
SELECT Name, Date__c, Total_Sets__c
FROM Programming__c
WHERE Date__c = TODAY AND Is_Completed__c = FALSE
```

---

## Next Steps

1. **Deploy** all metadata files (objects, trigger, tabs)
2. **Create sample data** (Programming, Line Items, Athletes)
3. **Build UI/LWC** to display Prescribed_Weight__c and Athlete_Current_PR__c
4. **Test trigger** by marking Programming_Line_Item__c Status to 'Completed'
5. **Monitor** Athlete_Performance__c creation and Is_New_PR__c accuracy
