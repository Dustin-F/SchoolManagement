import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "@/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClassesPage } from "@/pages/ClassesPage";
import { ClassDetailPage } from "@/pages/ClassDetailPage";
import { StudentsPage } from "@/pages/StudentsPage";
import { TeachersPage } from "@/pages/TeachersPage";
import { SubjectsPage } from "@/pages/SubjectsPage";
import { AttendancePage } from "@/pages/AttendancePage";
import { BehaviourPage } from "@/pages/BehaviourPage";
import { StudentDetailPage } from "@/pages/StudentDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:id" element={<ClassDetailPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="behaviour" element={<BehaviourPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
