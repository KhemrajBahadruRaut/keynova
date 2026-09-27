import PageContentAdminClient from "./PageContentAdminClient";
import HomepageActionCardsEditor from "./HomepageActionCardsEditor";

export default function AdminPageContentPage() {
  return (
    <div className="space-y-8">
      <HomepageActionCardsEditor />
      <PageContentAdminClient />
    </div>
  );
}
