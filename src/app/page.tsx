import TopBanner from "@/components/layout/top-banner";
import { financialQuotes } from "@/lib/constants";
import ClientHomePage from "@/components/pages/home-page";

export default function Home() {
  return (
    <>
      <TopBanner quotes={financialQuotes} />
      <div className="mt-6">
        <ClientHomePage />
      </div>
    </>
  );
}
