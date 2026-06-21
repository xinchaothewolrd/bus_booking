import UserHero from "../../components/user/home/UserHero";
import UserStats from "../../components/user/home/UserStats";
import UserPromotion from "../../components/user/home/UserPromotion";
import UserPopularRoute from "../../components/user/home/UserPopularRoute";
import UserNew from "../../components/user/home/UserNew";
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 font-sans antialiased overflow-x-hidden">
      <main className="pt-16">
        <UserHero />
        <UserStats />
        <UserPromotion />
        <UserPopularRoute />
        <UserNew />
      </main>
    </div>
  );
}
