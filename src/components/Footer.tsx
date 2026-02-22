import { BarChart3 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card py-10 mt-auto">
      <div className="container grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg text-primary mb-2">
            <BarChart3 className="h-5 w-5" />
            BRAJ Consultancy
          </div>
          <p className="text-sm text-muted-foreground">
            Professional statistical analysis, research, and academic support services.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Services</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Statistical Analysis</li>
            <li>Research Assistance</li>
            <li>Similarities/Plagiarism Report</li>
            <li>Validation of Instrument</li>
            <li>Paraphrasing</li>
            <li>Editing</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Contact</h4>
          <p className="text-sm text-muted-foreground">
            Email: baltazarabobojr@gmail.com<br />
            Phone: 09155090144
          </p>
          <a href="/certificate-of-business-name-registration.pdf" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
            View Certificate of Business Name Registration
          </a>
        </div>
      </div>
      <div className="container mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BRAJ Statistical and Research Consultancy. All rights reserved.
      </div>
    </footer>
  );
}
