import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLang } from "@/contexts/LangContext";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { lang } = useLang();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-8xl font-black text-primary mb-4 font-en">٤٠٤</p>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {lang === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        {lang === 'ar'
          ? 'يبدو إن الرابط خطأ أو الصفحة ما عادت موجودة'
          : "The page you're looking for doesn't exist or has been moved"}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-ya-accent hover:brightness-95 transition-all"
      >
        <Home className="h-4 w-4" />
        {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
      </Link>
      <p className="mt-12 text-lg font-bold text-primary font-en">YA</p>
    </div>
  );
};

export default NotFound;
