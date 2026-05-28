export function InterviewReportPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Interview Report</h1><p className="text-sm text-muted-foreground">Reports are generated automatically when you finish an interview practice session.</p></div>
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Start an interview from the Interview Coach page, answer the questions, and your report will appear with a PDF download button.
      </div>
    </div>
  );
}
