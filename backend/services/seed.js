/** Starter records are clearly labelled sample data. No demo passwords are seeded.
 * The marker prevents deleted content from magically reappearing at next startup.
 */
import { store } from "./store.js";
export async function seedData() {
  if (await store.get("metadata", "seed-v2")) return;
  if ((await store.list("metadata")).some((row) => row.key === "seed-v2"))
    return;
  const chefs = [
    [
      "Meera Sharma",
      "Bengaluru",
      "Whitefield",
      "Karnataka",
      8,
      499,
      ["North Indian", "South Indian"],
      "Vegetarian",
    ],
    [
      "Arjun Kumar",
      "Bengaluru",
      "Yelahanka",
      "Karnataka",
      6,
      599,
      ["South Indian", "Chinese"],
      "Both",
    ],
    [
      "Priya Singh",
      "Gurugram",
      "Sector 56",
      "Haryana",
      10,
      699,
      ["North Indian", "Continental"],
      "Both",
    ],
    [
      "Ravi Patel",
      "Bengaluru",
      "Indiranagar",
      "Karnataka",
      5,
      449,
      ["Gujarati", "North Indian"],
      "Vegetarian",
    ],
  ];
  if (!(await store.list("chefs")).length) {
    for (const [
      name,
      city,
      area,
      state,
      experience,
      price,
      cuisines,
      diet,
    ] of chefs) {
      await store.create("chefs", {
        name,
        city,
        area,
        state,
        country: "India",
        address: "Sample address",
        pincode: "560001",
        email: `${name.split(" ")[0].toLowerCase()}@example.com`,
        phone: "0000000000",
        experience,
        price,
        cuisines,
        diet,
        language: ["Hindi", "English"],
        availability: "Morning and evening, by arrangement",
        profilepic: "",
        aboutCook:
          "Sample profile: homestyle meals prepared around your food preferences. Edit or replace this record before using the app with real customers.",
        verified: false,
        starRating: 0,
        totalRatings: 0,
        sample: true,
        ownerId: `sample-${name}`,
      });
    }
  }
  const content = {
    services: [
      [
        "A cook for your everyday",
        "Fresh, familiar meals prepared in your own kitchen. Plan a month of easier mornings and relaxed evenings.",
        "monthly",
      ],
      [
        "One meal. Zero kitchen stress.",
        "Need a helping hand for the day? Choose a cook for one visit and enjoy food made your way.",
        "one-time",
      ],
      [
        "You host. Your chef cooks.",
        "Make room for good company. Plan a menu for your next gathering with a chef at home.",
        "party",
      ],
    ],
    blogs: [
      [
        "A little planning, a calmer kitchen",
        "Start with a weekly menu. List the ingredients you already have, then agree on a few meals with your cook. Keep dietary preferences and allergies written down. A short conversation before the first visit makes the rest of the week easier.",
        "Kitchen notes",
      ],
      [
        "What to prepare before your first visit",
        "Keep ingredients, utensils and a clean work surface ready. Share your preferred cooking time, number of guests and any food allergies. Your booking notes are a good place to record these details.",
        "Getting started",
      ],
    ],
    testimonials: [
      [
        "A calmer weekday routine",
        "Sample story: having help with meal preparation leaves more time to sit down and enjoy dinner together.",
        "Sample story",
      ],
    ],
    join: [
      [
        "Your skills deserve a place at the table.",
        "Create a cook profile, tell customers what you love to cook, and keep your details up to date. Registration does not claim professional certification or guarantee work.",
        "Cook with us",
      ],
    ],
    investors: [
      [
        "Building a simpler home-cooking experience",
        "Explore our project and share an investor enquiry. The local application stores your request for the administrator to review.",
        "Our direction",
      ],
    ],
    home: [
      [
        "Good food starts at home.",
        "Find a cook who fits your kitchen, your schedule, and the food you love.",
        "For every home",
      ],
    ],
    carousel: [
      [
        "Made in your kitchen",
        "Your ingredients. Your preferences. A little expert help.",
        "Home cooking",
      ],
    ],
    gallery: [
      [
        "At home, around the table",
        "Explore home cooking with a little help.",
        "Kitchen",
      ],
    ],
    food: [
      [
        "Everyday favourites",
        "Simple meals, prepared with your own ingredients.",
        "Everyday",
      ],
    ],
    "food-gallery": [
      [
        "A plate of comfort",
        "A kitchen ready for your favourite recipes.",
        "Inspiration",
      ],
    ],
    connect: [
      [
        "Let’s make good food happen",
        "Tell us what you need and we will keep your enquiry in the project dashboard.",
        "Contact",
      ],
    ],
  };
  for (const [type, entries] of Object.entries(content)) {
    if ((await store.list(`content_${type}`)).length) continue;
    for (const [title, description, category] of entries)
      await store.create(`content_${type}`, {
        title,
        content: description,
        category,
        image: "/assets/kitchen.png",
      });
  }
  await store.create("metadata", { key: "seed-v2" });
}
