import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "@/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClassesPage } from "@/pages/ClassesPage";
import { ClassDetailPage } from "@/pages/ClassDetailPage";
import { StudentsPage } from "@/pages/StudentsPage";
import { TeachersPage } from "@/pages/TeachersPage";
import { SubjectsPage } from "@/pages/SubjectsPage";
import { AttendancePage } from "@/pages/AttendancePage";
import { SkillsPage } from "@/pages/SkillsPage";
import { StudentDetailPage } from "@/pages/StudentDetailPage";
import { TaskEditPage } from "@/pages/TaskEditPage";
import { TaskGradePage } from "@/pages/TaskGradePage";
import { AuthPage } from "@/pages/AuthPage";
import { supabase } from "@/lib/supabase";
import { clearCloudUser, initializeCloudForUser } from "@/lib/storage";
import { useAppStore } from "@/store";
import { LoadingScreen } from "@/components/LoadingScreen";

const THEME_STORAGE_KEY = "schoolhub-theme";

export default function App() {
  const hydrateFromCloud = useAppStore((s) => s.hydrateFromCloud);
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!mounted) return;
      if (user) {
        const payload = await initializeCloudForUser(user.id);
        if (!mounted) return;
        hydrateFromCloud(payload);
        setAuthenticated(true);
      } else {
        clearCloudUser();
        setAuthenticated(false);
      }
      setAuthReady(true);
    };
    void bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!user) {
        clearCloudUser();
        setAuthenticated(false);
        setAuthReady(true);
        return;
      }
      void (async () => {
        const payload = await initializeCloudForUser(user.id);
        if (!mounted) return;
        hydrateFromCloud(payload);
        setAuthenticated(true);
        setAuthReady(true);
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateFromCloud]);

  if (!authReady) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthPage />
      </>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:id/profile" element={<Navigate to=".." replace relative="path" />} />
          <Route path="classes/:classId/tasks/:taskId/grade" element={<TaskGradePage />} />
          <Route path="classes/:classId/tasks/:taskId" element={<TaskEditPage />} />
          <Route path="classes/:id" element={<ClassDetailPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="students/:id/report-card" element={<Navigate to=".." replace relative="path" />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="points" element={<Navigate to="/skills" replace />} />
          <Route path="missing-work" element={<Navigate to="/" replace />} />
          <Route path="settings/assessment" element={<Navigate to="/" replace />} />
          <Route path="guide" element={<Navigate to="/" replace />} />
          <Route path="behaviour" element={<Navigate to="/skills" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
