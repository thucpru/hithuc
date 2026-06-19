import { Link } from "react-router-dom";
import { useT } from "@/context/LanguageContext";
import { UI_TEXT } from "@/lib/labels";

const NotFound = () => {
  const t = useT();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 font-serif text-5xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">{t(UI_TEXT.notFoundTitle)}</p>
        <Link to="/" className="text-foreground underline hover:opacity-70">
          {t(UI_TEXT.backHome)}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
