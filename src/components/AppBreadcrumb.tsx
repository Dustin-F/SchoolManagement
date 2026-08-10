import { Fragment, useMemo } from "react";
import { useLocation, useMatch, useSearchParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAppStore } from "@/store";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { readStudentReturnFrom } from "@/lib/studentNavigation";

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

export function useBreadcrumbCrumbs(): BreadcrumbCrumb[] | null {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);

  const classMatch = useMatch("/classes/:id");
  const studentMatch = useMatch("/students/:id");

  return useMemo(() => {
    const basePath = "/" + (location.pathname.split("/")[1] || "");
    const classId = classMatch?.params.id ?? searchParams.get("classId");
    const cls = classId ? classes.find((c) => c.id === classId) : undefined;

    if (classMatch?.params.id && cls) {
      return [
        { label: "Classes", href: "/classes" },
        { label: cls.name },
      ];
    }

    if (studentMatch?.params.id) {
      const student = students.find((s) => s.id === studentMatch.params.id);
      if (!student) return null;

      const from = readStudentReturnFrom(location.state, searchParams);
      const classFromMatch = from?.match(/^\/classes\/([^/?]+)/);
      if (classFromMatch) {
        const returnClass = classes.find((c) => c.id === classFromMatch[1]);
        if (returnClass) {
          return [
            { label: "Classes", href: "/classes" },
            { label: returnClass.name, href: from },
            { label: getStudentDisplayName(student) },
          ];
        }
      }

      return [
        { label: "Students", href: "/students" },
        { label: getStudentDisplayName(student) },
      ];
    }

    if (cls && basePath === "/attendance") {
      return [
        { label: "Classes", href: "/classes" },
        { label: cls.name, href: `/classes/${cls.id}` },
        { label: "Attendance" },
      ];
    }

    if (cls && basePath === "/points") {
      const tab = searchParams.get("tab");
      const crumbs: BreadcrumbCrumb[] = [
        { label: "Classes", href: "/classes" },
        { label: cls.name, href: `/classes/${cls.id}` },
      ];

      if (tab === "skills" || tab === "reports") {
        crumbs.push({ label: "Points", href: `/points?classId=${cls.id}` });
        crumbs.push({ label: tab === "skills" ? "Skills" : "Reports" });
      } else {
        crumbs.push({ label: "Points" });
      }

      return crumbs;
    }

    return null;
  }, [location.pathname, location.state, searchParams, classMatch, studentMatch, classes, students]);
}

export function AppBreadcrumb({ crumbs }: { crumbs: BreadcrumbCrumb[] }) {

  return (
    <Breadcrumb className="max-w-[min(100vw-7.5rem,42rem)] sm:max-w-[min(100vw-10rem,42rem)]">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink to={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
