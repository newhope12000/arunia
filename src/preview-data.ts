import content from "../server/content.json";

// Only fictional, public review content belongs in this static bundle.
// Member accounts, sessions, applications and payment data are never exported.
export default {
  user: null,
  demo: true,
  ready: false,
  paymentMode: "disabled",
  counselors: content.counselors,
  testimonials: content.testimonials,
  services: [
    {
      id: "individual",
      name: "개인상담",
      description: "정리되지 않은 마음부터, 내 속도로.",
      image: "arunia-individual.jpg",
      tag: "ONE ON ONE",
    },
    {
      id: "assessment",
      name: "심리검사",
      description: "나를 이해하는 또 하나의 방법.",
      image: "arunia-self-understanding.jpg",
      tag: "SELF DISCOVERY",
    },
    {
      id: "group",
      name: "함께하는 프로그램",
      description: "서로 다른 이야기가 만나는 시간.",
      image: "arunia-small-group.jpg",
      tag: "TOGETHER",
    },
  ],
};
