export interface GuideStep {
  title: string;
  body: string;
}

export interface GuideSection {
  id: string;
  title: string;
  /** One-line description shown under the title */
  summary: string;
  /** What this part of the app is for and why you would use it */
  purpose: string;
  steps: GuideStep[];
  tips?: string[];
}

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "What SchoolHub is, how to sign in, and how to find your way around.",
    purpose:
      "SchoolHub is a teacher-focused school management app. It brings together classes, rosters, attendance, assignments, grading, term reports, behaviour points, and report cards in one place — so you can run lessons, track progress, and send home official reports without switching tools.",
    steps: [
      {
        title: "Sign in",
        body: "Open SchoolHub in your browser and sign in with your email and password on the auth screen. Your data syncs to the cloud when connected — check the sync indicator in the header (green = synced, amber = pending, red = error). If you are evaluating the app, open the header settings menu (gear icon) and choose Load demo data to populate sample students, classes, tasks, and grades.",
      },
      {
        title: "Understand the layout",
        body: "The left sidebar is your main navigation. The top header shows breadcrumbs (your current path), theme toggle (sun/moon), cloud sync status, and a settings menu for backup and demo data. The main content area changes depending on which page you open. On mobile, tap the menu icon to open the sidebar drawer.",
      },
      {
        title: "User guide (this page)",
        body: "Click User guide at the bottom of the sidebar anytime you need help. Use the Contents list on the left (desktop) or the Jump to section dropdown (mobile) to move between topics. Each section explains what a feature is for and walks through how to use it step by step.",
      },
      {
        title: "Recommended first-time setup order",
        body: "1) Assessment settings — terms and grade categories. 2) Subjects and Teachers. 3) Classes with schedules and rosters. 4) Tasks and grading. 5) Post term grades and export report cards. See the Recommended workflow section at the end for the full term cycle.",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    summary: "Your daily home screen — stats, today's lessons, calendar, and incomplete work.",
    purpose:
      "The Dashboard answers: “What do I need to do today?” It surfaces scheduled lessons, school-wide counts, upcoming sessions on the calendar, and students who need follow-up — so you start each day from one screen instead of opening every class individually.",
    steps: [
      {
        title: "Stat cards",
        body: "Four cards at the top show totals for Students, Classes, Teachers, and Subjects. Click any card to jump to that list page. These counts exclude archived records.",
      },
      {
        title: "Today's lessons",
        body: "Lists every class that has a scheduled session today, with time and teacher. Click Open session to enter live class mode for that date — attendance, points, roster, and session notes. If a class does not appear, check that the class has schedule events configured on its Overview tab.",
      },
      {
        title: "Calendar",
        body: "Shows upcoming class sessions across the school. Click an event to open that class session on the correct date. Useful for planning the week and jumping into past or future sessions.",
      },
      {
        title: "Incomplete & to-do card",
        body: "Summarises students who need attention today: no attendance taken when a lesson was scheduled, overdue tasks, missing work, etc. Click View all to open the full Incomplete & to-do page, or use the chips to understand counts by reason.",
      },
      {
        title: "Quick add shortcuts",
        body: "Use the quick action buttons (where shown) to add a class or student without navigating away. These mirror the Add buttons on the Classes and Students pages.",
      },
    ],
    tips: [
      "Make the Dashboard your morning routine: check Today's lessons, scan incomplete items, then open your first session.",
    ],
  },
  {
    id: "subjects",
    title: "Subjects",
    summary: "Define the subjects your school teaches (Mathematics, English, etc.).",
    purpose:
      "Subjects organise your curriculum at the school level. Every class must belong to one subject. Subjects also link to assessment categories when you configure subject-specific grade weights.",
    steps: [
      {
        title: "Open Subjects",
        body: "Click Subjects in the sidebar. You will see a searchable table of all subjects with name, optional code, and how many classes use each one.",
      },
      {
        title: "Add a subject",
        body: "Click Add Subject. Enter the display name (e.g. “Mathematics”) and an optional short code (e.g. “MATH”). Save. You cannot delete a subject that still has classes assigned — reassign or archive those classes first.",
      },
      {
        title: "Edit or delete",
        body: "Use the row actions (pencil / trash) to update a name or remove an unused subject. Click the class count link to see which classes belong to that subject.",
      },
    ],
    tips: [
      "Set up all subjects before creating classes so each class is categorised correctly from the start.",
    ],
  },
  {
    id: "teachers",
    title: "Teachers",
    summary: "Maintain staff records and see which classes each teacher leads.",
    purpose:
      "Teachers are assigned as the main teacher (or co-teacher) on each class. Teacher names appear on class pages, report cards, and schedules so parents and staff know who is responsible for each group.",
    steps: [
      {
        title: "Open Teachers",
        body: "Click Teachers in the sidebar. Each card shows the teacher's name, optional email, and how many classes they are assigned to (as main or co-teacher).",
      },
      {
        title: "Add a teacher",
        body: "Click Add Teacher. Fill in name fields (including optional preferred or additional names), email, and phone if needed. Save. The teacher can now be selected when creating or editing a class.",
      },
      {
        title: "Assign to a class",
        body: "Teachers are not assigned from the Teachers page directly — open a class → Overview tab → Edit class, then pick the main teacher and any co-teachers. Co-teachers appear alongside the lead teacher on the class profile.",
      },
      {
        title: "Edit or remove",
        body: "Use Edit on a teacher card to update details. Delete removes the teacher record — you will need to reassign their classes first if any exist.",
      },
    ],
  },
  {
    id: "assessment",
    title: "Assessment settings",
    summary: "Configure academic terms, grade categories, letter bands, and missing-work rules.",
    purpose:
      "Assessment settings define how term grades are calculated school-wide. Without terms and categories, running grades and report cards cannot work correctly. This is the foundation for weighted term marks, letter grades, and what happens when students miss summative work.",
    steps: [
      {
        title: "Open Assessment",
        body: "Click Assessment in the sidebar (or go to /settings/assessment). The page has three areas: Academic terms, Assessment categories, and School grading settings.",
      },
      {
        title: "Academic terms — what they are for",
        body: "Terms (e.g. Semester 1, Semester 2) bound tasks, attendance summaries, behaviour points, and report cards to a date range. Each term has a start date, end date, and school year label. Exactly one term should be marked Active — that becomes the default everywhere you pick a term.",
      },
      {
        title: "Add or edit a term",
        body: "Click Add term. Enter name, school year (e.g. 2025-26), start and end dates, and sort order. Toggle Active for the current term. Edit or delete from the table — deleting a term may affect historical grades linked to it.",
      },
      {
        title: "Assessment categories — what they are for",
        body: "Categories group summative tasks (Quizzes, Exams, Projects, Homework, etc.) and assign each group a weight (%). Term grades are a weighted average of category averages — e.g. exams at 40% count more than quizzes at 25%. Global categories apply to all subjects unless you add subject-specific overrides.",
      },
      {
        title: "Set category weights",
        body: "Add categories with name, weight %, and sort order. The page shows a running total — aim for 100%. If weights do not add to 100%, a warning appears on term grade screens. Weights are used in calculation only; they are not shown on parent report cards.",
      },
      {
        title: "Letter grade bands",
        body: "Under School grading settings, define letter cutoffs (e.g. A ≥ 90%, B ≥ 80%). These map calculated percentages to A, B, C, etc. on term grades and report cards. Edit min percent for each band and save.",
      },
      {
        title: "Missing work policy",
        body: "Choose what happens when summative work is missing or ungraded: (1) Count as 0% — missing work hurts the average immediately. (2) Only graded work counts — running average ignores ungraded tasks. (3) Incomplete until all graded — no final % until every summative task has a mark. Most schools use count as 0% for report cards.",
      },
    ],
    tips: [
      "Complete terms and categories before creating summative tasks or posting grades.",
      "Changing weights mid-term recalculates running grades but does not auto-update already-posted official marks — re-post if needed.",
    ],
  },
  {
    id: "classes",
    title: "Classes",
    summary: "Create teaching groups, set schedules, and open the class workspace.",
    purpose:
      "A class is the main unit of daily work — it has a roster, schedule, tasks, grades, and session tools. Everything you do during teaching (attendance, points, assignments) happens inside a class.",
    steps: [
      {
        title: "Open the Classes page",
        body: "Click Classes in the sidebar. Switch between card view and list view using the toggle in the header. Each entry shows class name, subject, teacher, roster size, and next scheduled session.",
      },
      {
        title: "Create a class",
        body: "Click Add class. Enter: class name (e.g. 9A Mathematics), subject, main teacher, optional co-teachers, and schedule. The schedule defines when sessions appear on the Dashboard and calendar. Save to create the class — then add students from the Overview tab.",
      },
      {
        title: "Open a class",
        body: "Click the class name to open its detail page. Archived classes open read-only; restore them from the Classes page archived section to edit again.",
      },
      {
        title: "Overview tab — class profile",
        body: "Shows class summary, teacher(s), subject, task counts, attendance stats, schedule panel, and links to today's session. Use Edit class to change name, teachers, or schedule. Archive class when the school year ends.",
      },
      {
        title: "Class tabs explained",
        body: "Overview — profile, schedule, roster entry point. Units — curriculum unit planner. Tasks — create and manage assignments. Incomplete — missing/overdue work for this class only. Gradebook — grid of all students × tasks. Term grades — running and posted term marks per student.",
      },
      {
        title: "Session view (live lesson)",
        body: "When you open a session (from Dashboard or a date link), you leave the tab layout and enter session mode: roster table, seating grid, attendance buttons, points toolbar, session notes, and task quick actions. Exit session returns to the Overview tab. Session URLs include ?date= so attendance ties to that day.",
      },
      {
        title: "Archive or delete",
        body: "Archive from Overview or the Classes list when finished — preserves history but blocks edits. Permanently delete only from the archived section when you are sure you no longer need the data.",
      },
    ],
    tips: [
      "Set up the schedule when creating the class so Today's lessons works from day one.",
      "Use co-teachers when two staff share responsibility — both names appear on the class profile.",
    ],
  },
  {
    id: "students",
    title: "Students",
    summary: "Add students, import bulk rosters, and manage student profiles.",
    purpose:
      "The student record is the centre of attendance, grades, behaviour, and report cards. Each student has one profile used across all their classes — you enroll them on class rosters rather than creating duplicate records.",
    steps: [
      {
        title: "Open Students",
        body: "Click Students in the sidebar. Search by name, filter by class, and paginate large lists. The table shows name, classes, and quick actions.",
      },
      {
        title: "Add one student",
        body: "Click Add student. Complete name fields (legal name, preferred name, etc.), optional date of birth, email, parent/guardian name and phone. Save. The student exists school-wide but is not in any class until you add them to a roster.",
      },
      {
        title: "Import many students",
        body: "Click Import. Download the CSV template, fill one row per student following the column headers, upload the file. The importer previews rows and flags errors (missing names, bad dates). Fix issues and confirm import. Imported students still need to be added to class rosters unless the template includes class columns where supported.",
      },
      {
        title: "Enroll on a class roster",
        body: "Open a class → Overview or session roster → Add existing student (pick from list) or Add new student (create + enroll). Remove via the row menu on the roster table. A student can belong to many classes.",
      },
      {
        title: "Student profile page",
        body: "Click any student name to open their profile. Sections include: enrolled classes (links to each class), attendance summary and history, behaviour points log, tasks across all classes, term grades card with report card link, and edit/archive/delete actions.",
      },
      {
        title: "Archive or delete",
        body: "Archive graduates or leavers — they disappear from active lists but keep history. Restore from the archived section on the Students page. Permanent delete removes the record entirely (use with caution).",
      },
    ],
    tips: [
      "Use Import at the start of the year; use Add existing student for mid-year enrollments.",
      "Filter Students by class (URL ?classId=) when you need a class-specific list.",
    ],
  },
  {
    id: "sessions",
    title: "Sessions, roster & attendance",
    summary: "Run live lessons — attendance, seating, points, and session notes.",
    purpose:
      "Session mode is for the classroom in the moment: mark who is present, arrange seating, award behaviour points, update task status, and jot session notes. Attendance taken here feeds report cards and school-wide attendance reports.",
    steps: [
      {
        title: "Enter a session",
        body: "From Dashboard → Today's lessons → Open session, or from a class Overview → Open today's session, or from the calendar by clicking a scheduled event. The URL includes the session date.",
      },
      {
        title: "Take attendance",
        body: "For each student, click Present, Absent, Late, or Excused. Changes save immediately. Absent and late may prompt for a reason code depending on configuration. Attendance is stored per student, per class, per date.",
      },
      {
        title: "Seating grid",
        body: "Switch to the seating view to arrange students on a grid — drag students to seats for classroom management. Bulk tools can assign randomly or clear the layout. Useful for participation and behaviour tracking during the lesson.",
      },
      {
        title: "Award points in session",
        body: "The points toolbar shows pinned behaviour skills for this class. Select one or more students on the roster, then click a skill to award positive or negative points. Events are dated today and appear on the Points history and report card (for the matching term).",
      },
      {
        title: "Session notes",
        body: "The session notes card lets you type what was covered in that lesson. Notes are saved per class per date for your reference when reviewing the term.",
      },
      {
        title: "Roster task quick actions",
        body: "From the roster table, open task progress for a student to change status (not started, in progress, completed, missing, excused) or enter a score without leaving the session.",
      },
      {
        title: "Random student picker",
        body: "Use the random picker tool to call on students fairly — it cycles through the roster and lets you quickly set attendance or task status for the selected student.",
      },
      {
        title: "School-wide Attendance page",
        body: "Sidebar → Attendance. Pick a date and class to view or edit all students at once in a table. Use this for corrections, subs, or admin review rather than during live teaching.",
      },
    ],
    tips: [
      "Take attendance at the start of each session so Incomplete & to-do does not flag “no attendance”.",
      "Report card attendance only counts records whose date falls inside the selected term.",
    ],
  },
  {
    id: "tasks",
    title: "Tasks & assignments",
    summary: "Create homework, quizzes, exams, and projects; publish and track them.",
    purpose:
      "Tasks are assignments tied to a class and term. They track deadlines, completion status, and scores. Summative tasks drive term grades; formative tasks let you monitor practice without affecting the official term mark.",
    steps: [
      {
        title: "Where to manage tasks",
        body: "Open a class → Tasks tab. Lists active and archived tasks with deadline, type, publish status, and grade link. Click Add task or open an existing task to edit.",
      },
      {
        title: "Create a task — basics",
        body: "On the task edit page set: Title, Type (homework, quiz, exam, project, essay, worksheet, other), Deadline, Academic term, Assessment category (links to grade weights), and Assessment role (summative or formative). Summative = counts toward term grade. Formative = tracked only.",
      },
      {
        title: "Scoring setup",
        body: "Choose Score mode: Points (score out of max), Percentage (0–100%), or Rubric (criteria with point values). Optionally enable letter grades on the task to display A/B/C from the score. Rubric tasks use the criteria editor to define labels and max points per criterion.",
      },
      {
        title: "Description & instructions",
        body: "Add description and instructions text for your own reference and future student-facing views. These appear on the task detail where configured.",
      },
      {
        title: "Link to a unit",
        body: "If you use the unit planner, pick a unit from the dropdown so the task appears in curriculum context. Create units first on the class Units tab.",
      },
      {
        title: "Publish to students",
        body: "Toggle Published when the assignment is ready for students to see. Unpublished tasks remain teacher-only — useful for drafts. Published tasks appear in the gradebook grid.",
      },
      {
        title: "Track completion",
        body: "Each student gets a task record automatically. Status options: Not started, In progress, Completed, Missing, Excused. Open Task progress from the Tasks tab or roster to update status and scores per student.",
      },
      {
        title: "Archive a task",
        body: "Archive old tasks to hide them from active lists without deleting scores. Archived tasks stay in history and term grade calculations if they belong to the term.",
      },
    ],
    tips: [
      "Use formative role for practice homework; use summative for anything that should count on the report card.",
      "Match the task's term to the semester you are teaching — term grades only include tasks for that term.",
    ],
  },
  {
    id: "grading",
    title: "Grading & gradebook",
    summary: "Enter scores, use rubrics, and manage missing or excused work.",
    purpose:
      "Grading turns submitted work into numbers that feed running term grades. You can grade one task at a time or many tasks at once in the gradebook grid.",
    steps: [
      {
        title: "Grade one task (grade page)",
        body: "Class → Tasks tab → click Grade on a task, or open /classes/{classId}/tasks/{taskId}/grade. You see every roster student in a table with score inputs, rubric columns if applicable, status dropdown, and letter display. Enter scores and tab between cells. Changes save as you work.",
      },
      {
        title: "Gradebook grid",
        body: "Class → Gradebook tab. A spreadsheet-style grid: students down the left, published tasks across the top. Click any cell to enter or edit that student's score for that task. Best for batch grading after a test or when catching up on multiple assignments.",
      },
      {
        title: "Points scoring",
        body: "Enter the raw score; the app shows score / max (e.g. 12/15). Percentages for term calculation are derived automatically. On blur, values clamp to valid range.",
      },
      {
        title: "Percentage scoring",
        body: "Enter a value 0–100 directly. Used for tests already marked as percentages.",
      },
      {
        title: "Rubric scoring",
        body: "Each criterion has its own input. Total rubric points convert to a percent based on max possible. Expand criteria on the grade page to mark each dimension.",
      },
      {
        title: "Letter grades on tasks",
        body: "When letter grades are enabled on a task, the app maps the calculated percent to your task or school letter bands for display.",
      },
      {
        title: "Missing work",
        body: "Set status to Missing when work was not submitted. Under the school missing policy (Assessment settings), missing summative work typically counts as 0% in the term grade. This is why a few missing exams can lower the official mark significantly.",
      },
      {
        title: "Excused work",
        body: "Set Excused when a student should not be penalised — excused tasks are excluded from category averages and term calculation.",
      },
      {
        title: "Grade from student profile",
        body: "Student profile → Tasks section lists all assignments across classes. Open task progress to grade from the student-centric view during conferences.",
      },
    ],
    tips: [
      "After entering scores, check Class → Term grades to see updated running percentages.",
      "Gradebook only shows published tasks — publish first if you do not see a column.",
    ],
  },
  {
    id: "term-grades",
    title: "Term grades & posting",
    summary: "Running averages, official posted marks, and teacher comments.",
    purpose:
      "Term grades convert all summative task scores into one percentage and letter per student per class per term. Running grades update live; posted grades are the locked official mark that appears on report cards.",
    steps: [
      {
        title: "Open Term grades",
        body: "Class → Term grades tab. Select the term from the filter if needed. The table lists every roster student with running %, letter, posted % (if any), and completion indicators.",
      },
      {
        title: "How running % is calculated",
        body: "For each assessment category with summative tasks in that term: average the task scores → multiply by category weight → sum and normalise. Missing work follows your missing policy (usually 0%). Formative tasks are ignored. Only categories with at least one graded task contribute.",
      },
      {
        title: "Expand a student row",
        body: "Expand to see category breakdown and each task score. Verify the calculated mark matches your expectations before posting — especially if some tasks are still missing.",
      },
      {
        title: "Add a teacher comment",
        body: "Enter a comment in the student's row. Comments are stored with the term grade and print on the report card when grades are posted.",
      },
      {
        title: "Post term grades",
        body: "Click Post term grades (or post individually where available). This copies the current calculated mark to the official posted mark and locks it (lock icon). Parents see posted marks on report cards, not running marks.",
      },
      {
        title: "Re-post after changes",
        body: "If you change task scores after posting, running grades update but posted marks stay until you post again. Re-post before exporting report cards if marks should reflect new scores.",
      },
      {
        title: "Student profile term grades",
        body: "Student → Term grades card shows all enrolled classes for the selected term with running vs posted side by side, school-year average where applicable, and a Report card button.",
      },
    ],
    tips: [
      "Post only when all summative tasks are graded unless you intentionally accept incomplete marks.",
      "A weight warning on this page means category weights do not total 100% — fix in Assessment settings.",
    ],
  },
  {
    id: "report-cards",
    title: "Report cards",
    summary: "Official term report for parents — view on screen and export PDF.",
    purpose:
      "Report cards combine attendance, academic achievement, behaviour, and signature blocks into one formal document per student per term. They are designed for parent communication and printing — not day-to-day grading.",
    steps: [
      {
        title: "Open a report card",
        body: "Student profile → Term grades card → Report card button. Or navigate to Students → select student → Report card. URL: /students/{id}/report-card?termId={term}.",
      },
      {
        title: "Choose the term",
        body: "Use the Reporting period dropdown at the top of the document. Attendance, behaviour points, and grades all filter to that term's date range.",
      },
      {
        title: "What each section shows",
        body: "Student information — name, DOB, parent contact, enrolled classes. Attendance — rate and counts (present, late, absent, excused) for the term, plus per-class breakdown. Academic achievement — one block per class with official posted grade (lock icon), teacher comment if any, and a table of summative tasks with category, task name, and score. Behaviour — positive, negative, and net points with a by-class summary. Signatures — lines for teacher, head of school, and parent.",
      },
      {
        title: "Official vs running on report cards",
        body: "The large grade at the top of each class block is the posted official mark. If not yet posted, it shows “Grade not yet posted”. Task scores in the table reflect current records and help explain the mark.",
      },
      {
        title: "Export PDF",
        body: "Click Export PDF (top right). The app generates a clean, light-themed multi-page PDF without the app sidebar or dark mode. Open the downloaded file and print from your PDF viewer (Ctrl+P / File → Print).",
      },
      {
        title: "Before sending home",
        body: "Checklist: (1) Post term grades for every class. (2) Add teacher comments if desired. (3) Confirm attendance was taken during the term. (4) Confirm behaviour points use dates inside the term. (5) Export and proofread the PDF.",
      },
    ],
    tips: [
      "Report cards include all classes the student is enrolled in — no need to pick classes individually.",
      "Running grade hints on screen are for teachers only; they are omitted from the PDF.",
    ],
  },
  {
    id: "units",
    title: "Unit planner",
    summary: "Organise curriculum into units and link tasks to them.",
    purpose:
      "Units support inquiry-based planning (IB-style): group tasks under a unit theme with dates and optional inquiry fields. Helps teachers see the big picture of what a class is covering over weeks.",
    steps: [
      {
        title: "Open Units",
        body: "Class → Units tab. See all units for this class with title, date range, and linked task count.",
      },
      {
        title: "Create a unit",
        body: "Click Add unit. Enter title, start/end dates, and optional fields (central idea, lines of inquiry, etc. depending on form). Save.",
      },
      {
        title: "Link tasks to units",
        body: "When creating or editing a task, select the unit from the dropdown. Tasks without a unit still grade normally — linking is for organisation only.",
      },
      {
        title: "Edit or remove units",
        body: "Use row actions to edit details or delete empty units. Deleting a unit does not delete linked tasks — they become unlinked.",
      },
    ],
  },
  {
    id: "points",
    title: "Points & behaviour",
    summary: "School-wide behaviour skills, awarding points, history, and reports.",
    purpose:
      "Points replace paper merit charts — track positive and negative behaviour with consistent skills across all classes. Totals appear on report cards so parents see conduct alongside academics.",
    steps: [
      {
        title: "Open Points",
        body: "Sidebar → Points. Three tabs: History (all events), Skills (configure skills), Reports (weekly summaries).",
      },
      {
        title: "Create behaviour skills",
        body: "Skills tab → Add skill. Name it (e.g. Participation, On task, Talking out), choose Positive or Negative, set point value (+1, -1, etc.), pick an emoji, and save. Inactive skills can be hidden without deleting history.",
      },
      {
        title: "Pin skills to a class toolbar",
        body: "Skills appear on a class points toolbar when pinned for that class — configure pinned skills in class settings or use defaults from the school skill list.",
      },
      {
        title: "Award points during class",
        body: "In session view or from the roster: select student(s), click a skill button. One event is logged with today's date, class, student, and point value. Undo via History if needed.",
      },
      {
        title: "History tab",
        body: "Browse all point events. Filter by class, search by student name, delete mistaken entries. Each row shows date, student, class, skill, and points.",
      },
      {
        title: "Reports tab",
        body: "Weekly roll-up of points by student — useful for pastoral meetings or rewards. Navigate weeks with arrows.",
      },
      {
        title: "On report cards",
        body: "Behaviour section shows net, positive, and negative totals for the selected term, a short narrative summary, and per-class breakdown (recognitions count, positive, negative, net). Only events dated inside the term appear.",
      },
    ],
    tips: [
      "If behaviour looks empty on a report card, switch the term — points may have been recorded in a different semester.",
    ],
  },
  {
    id: "incomplete",
    title: "Incomplete & to-do",
    summary: "Find students who need follow-up — missing work, attendance, overdue tasks.",
    purpose:
      "Incomplete & to-do is your exception list. Instead of checking every class manually, it aggregates students who need action today or soon — so nothing slips through during busy weeks.",
    steps: [
      {
        title: "Open Incomplete & to-do",
        body: "Sidebar → Incomplete & to-do, or Dashboard → Incomplete card → View all.",
      },
      {
        title: "Reason types",
        body: "No attendance — lesson scheduled today but attendance not recorded. Overdue task — deadline passed, work not completed. Missing work — marked missing or not submitted. Filter by type using the dropdown.",
      },
      {
        title: "Filter by class",
        body: "Narrow to one class when you are focused on your own students. URL params ?class= and ?type= persist filters.",
      },
      {
        title: "Each row",
        body: "Shows student name, class, reason, and detail (e.g. task title). Click through to the student or class to resolve — take attendance, grade, or update task status.",
      },
      {
        title: "Class Incomplete tab",
        body: "Same logic scoped to one class: Class → Incomplete tab. Use before parent conferences or posting term grades for that subject only.",
      },
    ],
  },
  {
    id: "data-tools",
    title: "Backup, sync & demo data",
    summary: "Export your data, import backups, and load sample data.",
    purpose:
      "These tools protect your work and help you try the app safely. Cloud sync keeps data online; backup gives you a local JSON copy you control.",
    steps: [
      {
        title: "Cloud sync indicator",
        body: "Header shows sync status. Click for per-table health. Pending means changes are waiting to upload; errors show which table failed. Stay signed in for sync to complete.",
      },
      {
        title: "Export backup",
        body: "Header settings menu → Export backup. Downloads a JSON file with all school data. Store it securely — use before major changes or end of year.",
      },
      {
        title: "Import backup",
        body: "Settings menu → Import backup. Select a previously exported JSON file. This replaces current data — confirm carefully.",
      },
      {
        title: "Load demo data",
        body: "Settings menu → Load demo data. Resets to the built-in sample school with classes, students, tasks, and grades. Useful for training or testing report cards without entering real data.",
      },
      {
        title: "Theme",
        body: "Sun/moon icon toggles light and dark mode. Preference is saved in your browser.",
      },
      {
        title: "Sign out",
        body: "Settings menu → Sign out. Local session ends; data remains in cloud account.",
      },
    ],
    tips: [
      "Export backup regularly during report card season.",
      "Demo data overwrite is destructive — export first if you have real records.",
    ],
  },
  {
    id: "concepts",
    title: "Key concepts glossary",
    summary: "Terms used across grading, report cards, and assessment.",
    purpose:
      "Quick reference for ideas that appear in multiple places — helps when something on a report card or term grade screen does not match intuition.",
    steps: [
      {
        title: "Summative vs formative",
        body: "Summative tasks count toward the term grade (tests, major projects). Formative tasks are practice or homework you track but exclude from the official term calculation.",
      },
      {
        title: "Running vs posted grade",
        body: "Running = live calculation from current scores. Posted = locked official mark for report cards. Always post before sending PDFs home.",
      },
      {
        title: "Assessment category",
        body: "A bucket like Quizzes or Exams with a weight. Task scores in the bucket are averaged, then weighted into the term grade.",
      },
      {
        title: "Missing work policy",
        body: "School rule for unscored summative tasks. Count as zero is strictest; incomplete hides the final percent until everything is graded.",
      },
      {
        title: "Published task",
        body: "Visible in gradebook and student views. Unpublished tasks are teacher-only drafts.",
      },
      {
        title: "Active academic term",
        body: "The semester SchoolHub treats as “current” for default filters. Attendance and points on report cards still respect the term you select on the report card page.",
      },
      {
        title: "Archived record",
        body: "Classes, students, or tasks that are finished but kept for history. Archived items are read-only until restored.",
      },
    ],
  },
  {
    id: "workflow",
    title: "Recommended workflow",
    summary: "Start-of-year setup through end-of-term report cards.",
    purpose:
      "A single path through the app if you are setting up a new school year or training a colleague — follow in order the first time, then use daily shortcuts from the Dashboard.",
    steps: [
      {
        title: "Phase 1 — Foundation (before term starts)",
        body: "Assessment: create terms, categories (weights = 100%), letter bands, missing policy. Subjects: add all subjects. Teachers: add staff. Classes: create each class with subject, teacher, schedule. Students: import or add, then enroll on rosters.",
      },
      {
        title: "Phase 2 — Curriculum (first weeks)",
        body: "Units: create unit plans per class. Tasks: add summative tasks with deadlines, categories, and terms; publish when ready. Points: configure behaviour skills.",
      },
      {
        title: "Phase 3 — Daily teaching",
        body: "Dashboard → Open session. Take attendance, teach, award points, update task statuses. Grade submissions via Grade page or Gradebook as work arrives.",
      },
      {
        title: "Phase 4 — Monitor (ongoing)",
        body: "Check Incomplete & to-do and Dashboard incomplete card. Use Gradebook to catch ungraded cells. Review running term grades weekly.",
      },
      {
        title: "Phase 5 — Close the term",
        body: "Finish grading all summative tasks. Class → Term grades → verify breakdowns → add comments → Post term grades for each class. Student → Report card → choose term → Export PDF for each student (or batch as you process).",
      },
      {
        title: "Phase 6 — End of year",
        body: "Archive classes and students who have left. Export a full backup. Optionally start fresh next year with new terms and rosters while keeping archives for records.",
      },
    ],
  },
];

export function getGuideSection(id: string): GuideSection | undefined {
  return USER_GUIDE_SECTIONS.find((s) => s.id === id);
}
