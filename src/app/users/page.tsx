import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export const metadata = {
    title: "Social — QuestLog",
    description: "Find other gamers, connect, and view their profiles.",
};

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth");
    }

    return <UsersClient />;
}
