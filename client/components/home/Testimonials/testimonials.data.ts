export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  thumbnail: string;
  videoUrl: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "harshita-dhare",
    name: "Harshita Dhare",
    role: "Social Media Executive",
    quote:
      "After struggling for six months to find the right opportunity, Avatar India helped me build practical AI skills and prepare for interviews. Today, I'm happily working as a Social Media Executive.",
    thumbnail: "/testimonials/1.jpg",
    videoUrl:
      "https://res.cloudinary.com/w55pkbm8/video/upload/v1784712315/Avatar_Web_01_bho2pu.mp4",
  },
  {
    id: "riya-shinde",
    name: "Riya Shinde",
    role: "Fresh Graduate",
    quote:
      "I had no idea where to begin after graduation. The Direct2Hire Program gave me a clear roadmap, career direction, and the confidence to pursue the right opportunities.",
    thumbnail: "/testimonials/2.jpg",
    videoUrl:
      "https://res.cloudinary.com/w55pkbm8/video/upload/v1784712316/Avatar_Web_02_kjbquo.mp4",
  },
  {
    id: "vishwa-singh",
    name: "Vishwa Singh",
    role: "Second-Year Student",
    quote:
      "Starting early with Avatar India's Direct2Hire Program has helped me build real AI skills and become job-ready from my second year, giving me a strong advantage for my future career.",
    thumbnail: "/testimonials/3.jpg",
    videoUrl:
      "https://res.cloudinary.com/w55pkbm8/video/upload/v1784712313/Avatar_Web_03_jtxdeh.mp4",
  },
];
