import { Navigate, useParams } from "react-router-dom";

/** @deprecated Use /classes/:id?tab=overview */
export function ClassProfilePage() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/classes/${id}?tab=overview`} replace />;
}
