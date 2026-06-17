import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "@/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClassesPage } from "@/pages/ClassesPage";
import { ClassDetailPage } from "@/pages/ClassDetailPage";
import { ClassProfilePage } from "@/pages/ClassProfilePage";
import { StudentsPage } from "@/pages/StudentsPage";
import { TeachersPage } from "@/pages/TeachersPage";
import { SubjectsPage } from "@/pages/SubjectsPage";
import { AttendancePage } from "@/pages/AttendancePage";
import { PointsPage } from "@/pages/PointsPage";
import { MissingWorkPage } from "@/pages/MissingWorkPage";
import { Navigate } from "react-router-dom";
import { StudentDetailPage } from "@/pages/StudentDetailPage";
import { TaskEditPage } from "@/pages/TaskEditPage";
import { TaskGradePage } from "@/pages/TaskGradePage";
import { AssessmentSettingsPage } from "@/pages/AssessmentSettingsPage";
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
          <Route path="classes/:id/profile" element={<ClassProfilePage />} />
          <Route path="classes/:classId/tasks/:taskId/grade" element={<TaskGradePage />} />
          <Route path="classes/:classId/tasks/:taskId" element={<TaskEditPage />} />
          <Route path="classes/:id" element={<ClassDetailPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="points" element={<PointsPage />} />
          <Route path="missing-work" element={<MissingWorkPage />} />
          <Route path="settings/assessment" element={<AssessmentSettingsPage />} />
          <Route path="behaviour" element={<Navigate to="/points" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
