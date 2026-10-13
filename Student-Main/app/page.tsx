"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Heart,
  Laptop,
  Mic,
  Play,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { fetchMe, type SafeUser } from "@/lib/api";
import styles from "./landing.module.css";

type Language = "en" | "ar";

type LandingCopy = {
  brand: string;
  academy: string;
  demo: string;
  dashboard: string;
  tryDemo: string;
  signIn: string;
  heroLabel: string;
  headline: ReactNode;
  intro: string;
  watch: string;
  problemTitle: string;
  problemIntro: string;
  problemCards: [string, string, string][];
  solutionTitle: string;
  solutionRows: [string, string, string][];
  stepsTitle: string;
  steps: [string, string][];
  crestTitle: string;
  crestBody: string;
  featuresTitle: string;
  features: [string, string][];
  videoTitle: string;
  audiencesTitle: string;
  audiences: string[];
  audienceNote: string;
  teamTitle: string;
  teamIntro: string;
  team: string[];
  university: string;
  supervisor: string;
  closingTitle: string;
  closingBody: string;
  footer: string;
  rights: string;
};

const content: Record<Language, LandingCopy> = {
  en: {
    brand: "ALMA",
    academy: "ACADEMY",
    demo: "Demo",
    dashboard: "Dashboard",
    tryDemo: "Try the demo",
    signIn: "Sign in",
    heroLabel: "AI programming teacher",
    headline: <>Learn to code with an AI teacher who adapts to <em>you</em>.</>,
    intro:
      "ALMA is a friendly teacher you can talk to, in Arabic or English. It explains each lesson your way, step by step, any time you want.",
    watch: "Watch the 60-second video",
    problemTitle: "Four ways to learn. Each one gives something up.",
    problemIntro: "Imagine a student who wants to learn to code.",
    problemCards: [
      ["School", "A real teacher you can ask", "Outdated and too theoretical"],
      ["Private lessons", "Good teachers, parents follow progress", "Expensive, tiring, crowded groups"],
      ["Online lessons", "Cheaper, no travel", "Mostly recorded, hard to ask questions"],
      ["Self-study", "Any time, your own way", "No mentor, tiring and easy to quit"],
    ],
    solutionTitle: "Meet ALMA: all the strengths, none of the trade-offs.",
    solutionRows: [
      ["From school", "A teacher you can ask, by voice, any time", "Hands-on puzzles and games, not just theory"],
      ["From private lessons", "Clear explanations and progress for parents", "One-to-one attention, no crowd or commute"],
      ["From online lessons", "Affordable and from home, free to start", "A live conversation instead of recorded videos"],
      ["From self-study", "Learn any time, in the way you like", "Guidance, hints and duels, so you are never alone"],
    ],
    stepsTitle: "How ALMA teaches you",
    steps: [
      ["Tell ALMA about you", "A few quick questions: your age, level and how you like to learn."],
      ["Learn your way", "Lessons shaped around you, in Arabic or English, one step at a time."],
      ["Practice and play", "Solve puzzles, get hints when you are stuck, and challenge friends."],
    ],
    crestTitle: "The crest shows how ALMA is teaching you",
    crestBody: "Every lesson adapts to the way you learn best.",
    featuresTitle: "What you get",
    features: [
      ["Talk to your teacher", "Ask out loud and get a clear answer, any time."],
      ["Lessons that fit you", "Your name, your level and the way you like to learn."],
      ["Play and compete", "Live coding duels, ranks and leaderboards."],
      ["Parents and teachers in the loop", "Simple progress views and lessons built from a teacher's prompt."],
    ],
    videoTitle: "See ALMA in 60 seconds",
    audiencesTitle: "For learners, parents, schools and teachers",
    audiences: ["Learners of any age", "Parents", "Schools", "Teachers"],
    audienceNote: "Free to start on mobile and web.",
    teamTitle: "Built by a student team",
    teamIntro: "ALMA Academy is a graduation project by a team of seven students working on AI, design, apps and cloud.",
    team: ["Mohamed Tareq", "Mohamed Elfouly", "Mohamed Abo Auof", "Mohamed Saeed", "Mohamed Fared", "Mohamad Farouk", "Mohamad Ibrahim"],
    university: "October 6 University",
    supervisor: "Academic Supervisor",
    closingTitle: "Your coding journey starts here.",
    closingBody: "A friendly AI teacher, ready when you are.",
    footer: "ALMA Academy · Graduation project",
    rights: "All rights reserved.",
  },
  ar: {
    brand: "ألما",
    academy: "الأكاديمية",
    demo: "جرّب الآن",
    dashboard: "لوحة التحكم",
    tryDemo: "جرّب النسخة التجريبية",
    signIn: "تسجيل الدخول",
    heroLabel: "معلّم برمجة ذكي",
    headline: <>تعلّم البرمجة مع معلّم ذكي يتكيّف <em>معك</em>.</>,
    intro:
      "ألما معلّم ودود تتحدث إليه بالعربية أو الإنجليزية. يشرح لك كل درس بطريقتك، خطوةً بخطوة، وفي أي وقت.",
    watch: "شاهد الفيديو (60 ثانية)",
    problemTitle: "أربع طرق للتعلّم، وكل واحدة تتنازل عن شيء.",
    problemIntro: "تخيّل طالبًا يريد أن يتعلم البرمجة.",
    problemCards: [
      ["المدرسة", "معلّم حقيقي تسأله", "طرق قديمة ونظرية أكثر من اللازم"],
      ["الدروس الخصوصية", "معلمون جيدون وأولياء أمور يتابعون", "غالية ومتعبة وأعداد كبيرة"],
      ["الدروس عبر الإنترنت", "أرخص وبلا تنقّل", "مسجّلة غالبًا ويصعب السؤال"],
      ["الدراسة الذاتية", "في أي وقت وبطريقتك", "بلا مرشد ومتعبة وسهل أن تتوقف"],
    ],
    solutionTitle: "قابل ألما: كل المزايا بلا العيوب.",
    solutionRows: [
      ["من المدرسة", "معلّم تسأله بصوتك في أي وقت", "ألغاز وألعاب تطبيقية وليست نظريات فقط"],
      ["من الدروس الخصوصية", "شرح واضح ومتابعة للأهل", "اهتمام فردي بلا زحام أو تنقّل"],
      ["من الدروس عبر الإنترنت", "متاحة من المنزل ومجانية للبداية", "محادثة مباشرة بدلًا من الفيديوهات المسجّلة"],
      ["من الدراسة الذاتية", "تعلّم في أي وقت وبالطريقة التي تحبها", "إرشاد وتلميحات وتحديات، لن تكون وحدك"],
    ],
    stepsTitle: "كيف تعلّمك ألما",
    steps: [
      ["عرّف ألما بنفسك", "أسئلة بسيطة عن عمرك ومستواك والطريقة التي تفضّلها في التعلّم."],
      ["تعلّم بطريقتك", "دروس تناسبك، بالعربية أو الإنجليزية، خطوةً بخطوة."],
      ["تدرّب والعب", "حلّ الألغاز، واحصل على تلميحات، وتحدّ أصدقاءك."],
    ],
    crestTitle: "الشارة توضّح كيف تعلّمك ألما",
    crestBody: "كل درس يتكيّف مع الطريقة التي تناسبك.",
    featuresTitle: "ماذا ستحصل عليه",
    features: [
      ["تحدّث مع معلّمك", "اسأل بصوتك واحصل على إجابة واضحة في أي وقت."],
      ["دروس تناسبك", "اسمك ومستواك والطريقة التي تحب أن تتعلّم بها."],
      ["تعلّم وتنافس", "تحديات برمجة مباشرة وتصنيفات ولوحات متصدرين."],
      ["الأهل والمعلمون على اطّلاع", "متابعة سهلة للتقدم ودروس ينشئها المعلم."],
    ],
    videoTitle: "شاهد ألما في 60 ثانية",
    audiencesTitle: "للمتعلمين والأهل والمدارس والمعلمين",
    audiences: ["للمتعلمين من كل الأعمار", "الأهل", "المدارس", "المعلمون"],
    audienceNote: "ابدأ مجانًا على الهاتف والويب.",
    teamTitle: "طوّرها فريق من الطلاب",
    teamIntro: "أكاديمية ألما مشروع تخرج لفريق من سبعة طلاب يعملون في الذكاء الاصطناعي والتصميم والتطبيقات والسحابة.",
    team: ["محمد طارق", "محمد الفولي", "محمد أبو عوف", "محمد سعيد", "محمد فريد", "محمد فاروق", "محمد إبراهيم"],
    university: "جامعة 6 أكتوبر",
    supervisor: "المشرف الأكاديمي",
    closingTitle: "رحلتك في البرمجة تبدأ هنا.",
    closingBody: "معلّمك الذكي الودود جاهز عندما تكون أنت جاهزًا.",
    footer: "أكاديمية ألما · مشروع تخرج",
    rights: "جميع الحقوق محفوظة.",
  },
} satisfies Record<Language, Record<string, React.ReactNode>>;

const problemIcons = [GraduationCap, Users, Laptop, BookOpen];
const featureIcons = [Mic, BookOpen, Trophy, Heart];
const featureColors = ["mango", "sky", "lemon", "coral"] as const;

function Mascot({ celebrate = false }: { celebrate?: boolean }) {
  return (
    <svg className={styles.mascot} viewBox="0 0 220 240" role="img" aria-label="ALMA mascot">
      {celebrate && (
        <>
          <path d="m35 33 3 8 8 3-8 3-3 8-3-8-8-3 8-3zM184 45l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd84a" />
          <path d="m182 14 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#f25c78" />
        </>
      )}
      <rect x="100" y="9" width="20" height="20" rx="6" fill="#ffd84a" transform="rotate(10 110 19)" />
      <path d="M38 222V111a72 72 0 0 1 144 0v111a13 13 0 0 1-13 13H51a13 13 0 0 1-13-13Z" fill="#ffa11f" />
      <rect x="52" y="130" width="14" height="38" rx="7" fill="#f08a00" transform="rotate(-48 59 149)" />
      <rect x="154" y="130" width="14" height="38" rx="7" fill="#f08a00" transform="rotate(48 161 149)" />
      <rect x="70" y="76" width="80" height="72" rx="30" fill="#10292e" />
      <path d="M86 104q8-15 16 0m16 0q8-15 16 0" fill="none" stroke="#fff8ec" strokeWidth="5" strokeLinecap="round" />
      <path d="M91 119q19 26 38 0Z" fill="#fff8ec" />
      <circle cx="81" cy="121" r="5.5" fill="#f25c78" />
      <circle cx="139" cy="121" r="5.5" fill="#f25c78" />
      <path d="M92 235h16m20 0h16" stroke="#10292e" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>("en");
  const copy = content[language];
  const isArabic = language === "ar";
  const primaryHref = user?.role === "student" ? "/student/dashboard" : "/register";

  useEffect(() => {
    fetchMe()
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page} lang={language} dir={isArabic ? "rtl" : "ltr"}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label={`${copy.brand} ${copy.academy}`}>
          <BrandMark />
          <span className={styles.brandText}>
            <strong>{copy.brand}</strong>
            <small>{copy.academy}</small>
          </span>
        </Link>
        <nav className={styles.headerActions} aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"}>
          <div className={styles.languageToggle} role="group" aria-label={isArabic ? "اختيار اللغة" : "Choose language"}>
            <button
              type="button"
              className={!isArabic ? styles.activeLanguage : ""}
              aria-pressed={!isArabic}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={isArabic ? styles.activeLanguage : ""}
              aria-pressed={isArabic}
              onClick={() => setLanguage("ar")}
            >
              عربي
            </button>
          </div>
          <Link href={loading ? "/register" : primaryHref} className={styles.headerDemo}>
            {user ? copy.dashboard : copy.demo}
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}><i />{copy.heroLabel}</span>
              <h1 id="hero-title">{copy.headline}</h1>
              <p>{copy.intro}</p>
              <div className={styles.heroActions}>
                <Link href={primaryHref} className={styles.primaryButton}>
                  {copy.tryDemo}
                </Link>
                <a href="#video" className={styles.secondaryButton}>{copy.watch}</a>
              </div>
            </div>
            <div className={styles.heroArt} aria-hidden="true">
              <span className={styles.sparkleOne}>✦</span>
              <span className={styles.sparkleTwo}>✦</span>
              <div className={styles.mascotStage}><Mascot celebrate /></div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="problem-title">
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2 id="problem-title">{copy.problemTitle}</h2>
              <p>{copy.problemIntro}</p>
            </header>
            <div className={styles.problemGrid}>
              {copy.problemCards.map(([title, strength, tradeoff], index) => {
                const Icon = problemIcons[index];
                return (
                  <article className={styles.problemCard} key={title}>
                    <div className={styles.cardTitle}>
                      <span className={`${styles.iconArch} ${styles[featureColors[index]]}`}><Icon size={20} /></span>
                      <h3>{title}</h3>
                    </div>
                    <p><Check size={13} aria-hidden="true" />{strength}</p>
                    <p className={styles.tradeoff}><span aria-hidden="true">•</span>{tradeoff}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.sectionCompact}>
          <div className={styles.container}>
            <div className={styles.solution}>
              <h2>{copy.solutionTitle}</h2>
              <div className={styles.solutionRows}>
                {copy.solutionRows.map(([source, keeps, adds], index) => (
                  <article className={styles.solutionRow} key={source}>
                    <strong><span className={`${styles.sourceMark} ${styles[featureColors[index]]}`} />{source}</strong>
                    <p><Check size={15} />{keeps}</p>
                    <p><Sparkles size={15} />{adds}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="steps-title">
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2 id="steps-title">{copy.stepsTitle}</h2>
            </header>
            <div className={styles.stepsGrid}>
              {copy.steps.map(([title, description], index) => (
                <article className={styles.stepCard} key={title}>
                  <span className={`${styles.stepNumber} ${index === 2 ? styles.stepNumberMango : ""}`}>{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <div className={styles.crestCard}>
              <div className={styles.crestMascot}><Mascot /></div>
              <div>
                <h3>{copy.crestTitle}</h3>
                <p>{copy.crestBody}</p>
                <div className={styles.crestModes} aria-hidden="true">
                  <span className={styles.skyDot} /><span className={styles.coralDot} />
                  <span className={styles.lagoonDot} /><span className={styles.lemonDot} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="features-title">
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2 id="features-title">{copy.featuresTitle}</h2>
            </header>
            <div className={styles.featureGrid}>
              {copy.features.map(([title, description], index) => {
                const Icon = featureIcons[index];
                return (
                  <article className={styles.featureCard} key={title}>
                    <span className={`${styles.iconArch} ${styles[featureColors[index]]}`}><Icon size={20} /></span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="video" className={styles.sectionCompact} aria-labelledby="video-title">
          <div className={styles.container}>
            <h2 id="video-title" className={styles.videoTitle}>{copy.videoTitle}</h2>
            <Link href={primaryHref} className={styles.videoCard} aria-label={copy.tryDemo}>
              <span className={styles.videoGlow} />
              <span className={styles.playArch}><Play size={24} fill="currentColor" /></span>
              <span className={styles.videoDuration}>01:00</span>
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.audienceCard}>
              <h2>{copy.audiencesTitle}</h2>
              <div className={styles.audienceChips}>
                {copy.audiences.map((audience) => <span key={audience}>{audience}</span>)}
              </div>
              <p>{copy.audienceNote}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2>{copy.teamTitle}</h2>
              <p>{copy.teamIntro}</p>
            </header>
            <div className={styles.teamGrid}>
              {copy.team.map((name, index) => (
                <article className={styles.teamCard} key={name}>
                  <span>{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                  <strong>{name}</strong>
                  <small>Team {index + 1}</small>
                </article>
              ))}
            </div>
            <div className={styles.universityBox}>
              <GraduationCap size={18} />
              <span>{copy.university}</span>
              <Star size={15} />
              <span>{copy.supervisor}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.closingCard}>
              <div className={styles.closingMascot}><Mascot celebrate /></div>
              <h2>{copy.closingTitle}</h2>
              <p>{copy.closingBody}</p>
              <Link href={primaryHref} className={styles.primaryButton}>
                {copy.tryDemo}<ArrowRight size={16} />
              </Link>
              <p className={styles.loginPrompt}>
                {isArabic ? "لديك حساب؟" : "Already have an account?"}{" "}
                <Link href="/login">{copy.signIn}</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><BrandMark /><span>{copy.footer}</span></div>
        <p>© {new Date().getFullYear()} ALMA Academy. {copy.rights}</p>
      </footer>
    </div>
  );
}
