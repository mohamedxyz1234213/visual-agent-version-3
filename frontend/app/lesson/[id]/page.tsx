import LessonPageClient from "@/components/Lesson/LessonPageClient";

type LessonPageProps = {
  params: { id: string };
  searchParams?: {
    series?: string;
    total?: string;
  };
};

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  const lessonId = params.id;
  const seriesId = typeof searchParams?.series === "string" ? searchParams.series : null;
  const totalLessons = Number.parseInt(searchParams?.total ?? "1", 10) || 1;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

  let initialLesson = null;
  let initialError: string | null = null;

  try {
    const response = await fetch(`${apiBase}/lessons/${lessonId}`, { cache: "no-store" });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    initialLesson = await response.json();
  } catch (error) {
    initialError = error instanceof Error ? error.message : String(error);
  }

  return (
    <LessonPageClient
      lessonId={lessonId}
      initialLesson={initialLesson}
      initialError={initialError}
      seriesId={seriesId}
      totalLessons={totalLessons}
    />
  );
}
