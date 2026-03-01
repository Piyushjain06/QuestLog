import DiscoverClient from "./DiscoverClient";

export const metadata = {
    title: "Discover Games — QuestLog",
    description: "Search over 80,000 games from TheGamesDB and add them to your library.",
};

export default function DiscoverPage() {
    return <DiscoverClient />;
}
