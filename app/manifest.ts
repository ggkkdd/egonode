import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Armaged.online — Death by AI",
    short_name: "Armaged.online",
    description:
      "Face 10 levels of Armageddon. Write a survival plan and let the AI Judge decide if you live or die.",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    orientation: "portrait-primary",
    categories: ["games", "entertainment"],
    lang: "en",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
