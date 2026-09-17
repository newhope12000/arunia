import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Menu,
  X,
  Heart,
  Leaf,
  MapPin,
  Clock,
  ShieldCheck,
  MessageCircle,
  Sun,
  Sprout,
  Users,
  Mail,
  LogOut,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import "./style.css";
type User = { id: string; name: string; email: string; role: string };
type Counselor = {
  id: string;
  name: string;
  fields: string[];
  regions: string[];
  qualifications: string;
  description: string;
  fee: string;
  demo: boolean;
};
type Review = {
  id: string;
  name: string;
  age: number;
  occupation: string;
  region: string;
  concern: string;
  title: string;
  quote: string;
  label: string;
};
type Service = {
  id: string;
  name: string;
  description: string;
  image: string;
  tag: string;
};
type RequestItem = {
  id: string;
  status: string;
  data: {
    service: string;
    program?: string;
    topics: string[];
    region: string;
    availability: string;
  };
  counselor: Counselor | null;
  amount: number;
  slot: string;
  location: string;
  venue_note: string;
  offer_expires: string;
  offer_revision: string;
  created: string;
  order?: { id: string; status: string; provider: string; receipt?: string };
  support: {
    id: string;
    kind: string;
    note: string;
    status: string;
    created: string;
  }[];
  member_name?: string;
  member_email?: string;
};
type Bootstrap = {
  user: User | null;
  demo: boolean;
  ready: boolean;
  paymentMode: string;
  counselors: Counselor[];
  services: Service[];
  testimonials: Review[];
};
const AppContext = createContext<{
  data: Bootstrap;
  refresh: () => Promise<void>;
}>({} as never);
const useApp = () => useContext(AppContext);
async function api<T = any>(url: string, body?: unknown): Promise<T> {
  const r = await fetch("/api" + url, {
    credentials: "same-origin",
    ...(body !== undefined
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const value = await r.json();
  if (!r.ok) throw new Error(value.error || "요청을 처리하지 못했습니다.");
  return value;
}
const money = (n: number) => new Intl.NumberFormat("ko-KR").format(n) + "원";
const date = (v: string) =>
  new Date(v).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const statuses: Record<string, string> = {
  pending: "매칭 확인 중",
  offered: "상담 제안 도착",
  accepted: "결제 대기",
  confirmed: "예약 확정",
  completed: "상담 완료",
  cancelled: "신청 취소",
  paid: "결제 완료",
  refunded: "결제 취소",
  confirming: "결제 확인 중",
  reconciliation_required: "결제 상태 확인 필요",
  refund_pending: "취소 확인 중",
  failed: "결제 미승인",
};
const topics = [
  "일·진로 고민",
  "불안한 마음",
  "관계의 어려움",
  "나를 알고 싶어요",
  "지친 일상",
  "함께 이야기하고 싶어요",
];
const serviceNames: Record<string, string> = {
  individual: "개인상담",
  assessment: "심리검사",
  group: "그룹 프로그램",
};
function useLoad<T>(url: string) {
  const [value, setValue] = useState<T | null>(null),
    [error, setError] = useState("");
  const reload = async () => {
    try {
      setValue(await api<T>(url));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    setValue(null);
    void reload();
  }, [url]);
  return { value, error, reload };
}
function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={"notice " + tone}
    >
      {children}
    </div>
  );
}
function Button({
  to,
  children,
  light = false,
}: {
  to: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link className={"button" + (light ? " secondary" : "")} to={to}>
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
function SectionHead({
  eyebrow,
  title,
  text,
  to,
  link = "자세히 알아보기",
}: {
  eyebrow: string;
  title: string;
  text?: string;
  to?: string;
  link?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {text && <p className="muted">{text}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {link}
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
function Brand() {
  return (
    <Link to="/" className="brand" aria-label="어른이아 홈">
      <span className="brand-mark">
        <span />
      </span>
      어른이아<span className="brand-dot">.</span>
    </Link>
  );
}
function Shell() {
  const { data, refresh } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    const titles: Record<string, string> = {
      "/": "나다운 속도로, 함께",
      "/counselors": "상담 전문가",
      "/services": "상담·심리검사",
      "/programs": "함께하는 프로그램",
      "/guide": "이용 안내",
      "/about": "어른이아 소개",
      "/reviews": "상담 이야기 미리보기",
      "/account": "나의 상담 여정",
      "/admin": "운영 관리",
    };
    document.title =
      "어른이아 — " + (titles[location.pathname] || "마음을 만나는 시간");
    let meta = document.querySelector<HTMLMetaElement>("meta[name=robots]");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content =
      data.demo ||
      ["/account", "/admin", "/checkout", "/payment", "/request"].some((p) =>
        location.pathname.startsWith(p),
      )
        ? "noindex,nofollow"
        : "index,follow";
  }, [location.pathname, data.demo]);
  return (
    <>
      <a href="#main" className="skip">
        본문으로 바로가기
      </a>
      {data.demo && (
        <div className="preview-bar">
          미리보기{" "}
          <span>
            사진·상담사·후기는 구성용 예시이며, 실제 결제가 발생하지 않습니다.
          </span>
        </div>
      )}
      <header className="header">
        <div className="container header-inner">
          <Brand />
          <nav className={open ? "nav open" : "nav"} aria-label="주 메뉴">
            <NavLink to="/counselors">상담 전문가</NavLink>
            <NavLink to="/services">상담·심리검사</NavLink>
            <NavLink to="/programs">함께하는 프로그램</NavLink>
            <NavLink to="/guide">이용 안내</NavLink>
            <NavLink to="/about">어른이아 소개</NavLink>
            <NavLink
              className="mobile-account"
              to={data.user ? "/account" : "/login"}
            >
              {data.user ? "마이페이지" : "로그인·회원가입"}
            </NavLink>
          </nav>
          <div className="header-actions">
            <Link
              className="account-link"
              to={data.user ? "/account" : "/login"}
            >
              {data.user ? "마이페이지" : "로그인"}
            </Link>
            <Link className="button small" to="/request">
              상담 시작하기
              <ArrowUpRight size={15} />
            </Link>
            <button
              className="menu-button"
              aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/counselors" element={<Counselors />} />
          <Route path="/counselors/:id" element={<CounselorDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/about" element={<About />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth signup />} />
          <Route
            path="/request"
            element={
              <Protected>
                <Application />
              </Protected>
            }
          />
          <Route
            path="/account"
            element={
              <Protected>
                <Account />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected admin>
                <Admin />
              </Protected>
            }
          />
          <Route
            path="/checkout/:id"
            element={
              <Protected>
                <Checkout />
              </Protected>
            }
          />
          <Route
            path="/payment/success"
            element={
              <Protected>
                <PaymentResult />
              </Protected>
            }
          />
          <Route path="/payment/fail" element={<PaymentFailure />} />
          <Route path="/privacy" element={<Policy privacy />} />
          <Route path="/terms" element={<Policy />} />
          {[
            "index.html",
            "about.html",
            "vision.html",
            "values.html",
            "pricing.html",
            "programs.html",
            "contact.html",
            "growth.html",
            "growth_1.html",
            "growth_2.html",
            "leadership1.html",
            "privacy.html",
            "terms.html",
          ].map((p) => (
            <Route
              key={p}
              path={"/" + p}
              element={
                <Navigate
                  replace
                  to={
                    p === "index.html"
                      ? "/"
                      : p === "privacy.html"
                        ? "/privacy"
                        : p === "terms.html"
                          ? "/terms"
                          : p === "contact.html"
                            ? "/request"
                            : p === "about.html"
                              ? "/about"
                              : p === "pricing.html"
                                ? "/services"
                                : "/programs"
                  }
                />
              }
            />
          ))}
          <Route
            path="*"
            element={
              <div className="container page compact">
                <p className="eyebrow">404</p>
                <h1>잠시, 길을 다시 찾아볼까요?</h1>
                <Button to="/">홈으로 돌아가기</Button>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <Brand />
              <p>
                어른이라는 이름 앞에서,
                <br />
                당신의 마음은 혼자이지 않도록.
              </p>
            </div>
            <div className="footer-links">
              <Link to="/counselors">상담 전문가</Link>
              <Link to="/guide">이용 안내</Link>
              <Link to="/about#partnership">기관·기업 협업</Link>
              <Link to="/privacy">개인정보 처리방침</Link>
              <Link to="/terms">이용약관</Link>
              {data.user?.role === "admin" && (
                <Link to="/admin">운영 관리</Link>
              )}
              {data.user && (
                <button
                  onClick={async () => {
                    await api("/auth/logout", {});
                    await refresh();
                  }}
                >
                  로그아웃 <LogOut size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} ARUNIA. All hearts welcome.
            </span>
            <span>서울·경기 · 상담 전문가 매칭 서비스</span>
          </div>
          <p className="fine">
            고정 상담센터를 운영하지 않습니다. 상담 장소와 일정·비용은 예약 전에
            함께 확인합니다.
            {" 페이지의 사진은 AI로 제작한 콘셉트 이미지입니다."}
          </p>
        </div>
      </footer>
    </>
  );
}
function Home() {
  const { data } = useApp();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-dot" />
            서울·경기 2030을 위한 마음 연결
          </p>
          <h1>
            어른이 되어가는 날들,
            <br />
            마음에도 <em>내 편</em>이 필요하니까.
          </h1>
          <p className="hero-description">
            잘하고 싶은 마음도, 잠시 쉬고 싶은 마음도.
            <br />
            당신의 이야기에 귀 기울일 상담 전문가를 만나보세요.
          </p>
          <div className="hero-buttons">
            <Button to="/request">나에게 맞는 상담 찾기</Button>
            <Link className="text-link" to="/guide">
              처음이라면
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="mini-flower">
              <Sprout size={20} />
            </span>
            <span>어떤 이야기부터 시작해도 괜찮아요.</span>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="/images/arunia-hero.jpg"
            alt="햇살이 들어오는 공간에서 편안하게 대화하는 두 사람의 콘셉트 사진"
            fetchPriority="high"
          />
          <span className="image-label">a little space for your heart</span>
          <div className="image-caption">
            <span className="caption-icon">
              <Heart size={19} />
            </span>
            <span>
              혼자였던 마음에,
              <br />
              <strong>함께라는 작은 변화.</strong>
            </span>
            <span className="caption-spark">✳</span>
          </div>
        </div>
      </section>
      <div className="promise-strip">
        <div className="container">
          <span>
            <ShieldCheck />
            전문가의 정보를 투명하게
          </span>
          <span>
            <MapPin />내 생활에 맞는 지역과 시간
          </span>
          <span>
            <MessageCircle />
            충분히 확인하고 시작하는 상담
          </span>
        </div>
      </div>
      <section className="container section concerns">
        <SectionHead
          eyebrow="HOW IS YOUR HEART?"
          title="요즘, 어떤 마음으로 지내고 있나요?"
          text="딱 맞는 단어가 없어도 괜찮아요. 가까운 마음부터 골라보세요."
        />
        <div className="concern-grid">
          {topics.map((t, i) => {
            const Icon = [Sprout, Sun, Heart, Leaf, Clock, Users][i];
            return (
              <Link
                to={"/request?topic=" + encodeURIComponent(t)}
                key={t}
                className="concern"
              >
                <span className={"concern-icon tone-" + i}>
                  <Icon size={26} />
                </span>
                <span>{t}</span>
                <ArrowUpRight size={16} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="cream section">
        <div className="container">
          <SectionHead
            eyebrow="MEET YOUR PERSON"
            title="마음을 나누기 전에, 사람을 먼저."
            text="다루는 주제와 상담 방식, 지역을 살펴보세요."
            to="/counselors"
            link="전문가 둘러보기"
          />
          {data.demo && (
            <p className="inline-demo">
              프로필 디자인 미리보기 · 아래 상담사는 가상 예시입니다.
            </p>
          )}
          <div className="counselor-grid">
            {data.counselors.slice(0, 3).map((c, i) => (
              <CounselorCard key={c.id} c={c} index={i} />
            ))}
          </div>
          {!data.counselors.length && (
            <Empty
              title="상담 전문가 소개를 준비하고 있어요."
              text="자격과 활동 정보를 확인한 후 소개하겠습니다."
            />
          )}
        </div>
      </section>
      <section className="container section">
        <SectionHead
          eyebrow="WAYS TO CARE FOR YOU"
          title="지금의 나에게, 필요한 만큼."
          text="대화부터 자기이해, 함께하는 시간까지."
          to="/services"
          link="서비스·비용 안내"
        />
        <ServiceCards />
      </section>
      <section className="container section journey">
        <div>
          <p className="eyebrow">ONE STEP AT A TIME</p>
          <h2>
            처음의 망설임이
            <br />
            편안한 만남이 되도록.
          </h2>
          <p className="muted">
            신청한다고 바로 결제되지 않아요.
            <br />
            상담사·장소·비용을 확인한 뒤 결정하세요.
          </p>
          <Button to="/guide" light>
            이용 과정 살펴보기
          </Button>
        </div>
        <div className="steps">
          {[
            [
              "01",
              "지금의 마음을 알려주세요",
              "고민 주제, 원하는 지역과 시간을 선택해요.",
            ],
            [
              "02",
              "내게 맞는 제안을 살펴봐요",
              "상담 전문가와 일정, 장소, 총비용을 함께 확인해요.",
            ],
            [
              "03",
              "내 속도로 시작해요",
              "제안을 수락하고 결제하면 첫 만남이 정해져요.",
            ],
          ].map((s) => (
            <div className="step" key={s[0]}>
              <span>{s[0]}</span>
              <div>
                <h3>{s[1]}</h3>
                <p>{s[2]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {data.demo && (
        <section className="soft-peach section">
          <div className="container">
            <SectionHead
              eyebrow="STORIES, IN PREVIEW"
              title="저마다의 속도로, 마음을 만나는 이야기."
              text="서로 다른 열 가지 일상을 바탕으로 그려본 상담 경험입니다."
              to="/reviews"
              link="가상 후기 10개 보기"
            />
            <p className="inline-demo">
              구성 확인용 가상 후기입니다. 실제 이용 경험이나 상담 효과를 뜻하지
              않습니다.
            </p>
            <div className="review-grid">
              {data.testimonials.slice(0, 3).map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="container section faq-home">
        <SectionHead
          eyebrow="A FEW THINGS TO KNOW"
          title="궁금했던 마음까지, 편하게."
          to="/guide#faq"
          link="자주 묻는 질문"
        />
        <FAQ limit={4} />
      </section>
      <FinalCTA />
    </>
  );
}
function ServiceCards() {
  const { data } = useApp();
  return (
    <div className="service-grid">
      {data.services.map((s) => (
        <Link
          className="service-card"
          to={s.id === "group" ? "/programs" : "/services#" + s.id}
          key={s.id}
        >
          <div className="service-image">
            <img
              loading="lazy"
              src={"/images/" + s.image}
              alt={s.name + " 콘셉트 사진"}
            />
            <span>{s.tag}</span>
          </div>
          <div className="service-copy">
            <div>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
            </div>
            <span className="round-arrow">
              <ArrowUpRight size={22} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
function CounselorCard({ c, index = 0 }: { c: Counselor; index?: number }) {
  return (
    <Link to={"/counselors/" + c.id} className="counselor-card">
      <div className="counselor-top">
        <div className={"avatar avatar-" + (index % 3)}>
          {c.name.slice(1)}
          <Leaf size={21} />
        </div>
        <span className="subtle-tag">
          {c.demo ? "가상 상담사" : "상담 전문가"}
        </span>
      </div>
      <h3>
        {c.name}
        <span>상담사</span>
      </h3>
      <p className="counselor-description">{c.description}</p>
      <div className="tags">
        {c.fields.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <div className="counselor-bottom">
        <span>
          <MapPin size={14} />
          {c.regions.join(" · ")}
        </span>
        <ArrowUpRight size={19} />
      </div>
    </Link>
  );
}
function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="review-card">
      <span className="review-quote">“</span>
      <span className="demo-tag">구성 확인용 가상 후기</span>
      <h3>{r.title}</h3>
      <p>{r.quote}</p>
      <div className="review-person">
        <span className="person-initial">{r.name[0]}</span>
        <div>
          <strong>
            {r.name} · {r.age}세
          </strong>
          <small>
            {r.occupation} / {r.region}
          </small>
        </div>
      </div>
      <span className="review-topic">#{r.concern}</span>
    </article>
  );
}
function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="container">
        <span className="cta-flower">
          <Sprout size={44} strokeWidth={1.2} />
        </span>
        <p className="eyebrow">YOUR HEART, YOUR PACE</p>
        <h2>
          괜찮아지려고 애쓰기 전에,
          <br />
          있는 그대로 이야기해요.
        </h2>
        <p>어른이아가 당신의 첫 대화를 함께 준비할게요.</p>
        <Button to="/request" light>
          나에게 맞는 상담 찾기
        </Button>
      </div>
    </section>
  );
}
function PageIntro({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
function Counselors() {
  const { data } = useApp();
  const [region, setRegion] = useState("전체"),
    [query, setQuery] = useState("");
  const rows = data.counselors.filter(
    (c) =>
      (region === "전체" || c.regions.some((r) => r.startsWith(region))) &&
      (c.name + c.fields.join("") + c.description).includes(query),
  );
  return (
    <div className="container page">
      <PageIntro
        label="FIND YOUR PERSON"
        title="마음이 향하는 사람을 만나세요."
      >
        상담 분야와 지역을 살펴보고, 나에게 맞는 만남을 시작해요.
      </PageIntro>
      {data.demo && (
        <Notice>
          현재 6개 프로필은 구성 확인용 가상 상담사입니다. 실제 자격과 일정을
          등록한 뒤 정식 매칭을 열 예정입니다.
        </Notice>
      )}
      <div className="filter-bar">
        <label className="search-input">
          <SlidersHorizontal size={18} />
          <input
            aria-label="이름 또는 상담 주제 검색"
            placeholder="이름 또는 상담 주제 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="pills" aria-label="지역 선택">
          {["전체", "서울", "경기"].map((r) => (
            <button
              aria-pressed={r === region}
              className={r === region ? "selected" : ""}
              onClick={() => setRegion(r)}
              key={r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <p className="results-count">
        {rows.length}개의 {data.demo ? "예시 프로필" : "상담사 프로필"}
      </p>
      <div className="counselor-grid">
        {rows.map((c, i) => (
          <CounselorCard key={c.id} c={c} index={i} />
        ))}
      </div>
      {rows.length === 0 && (
        <Empty
          title="조건에 맞는 전문가가 없어요."
          text="다른 주제나 지역으로 찾아보세요."
        />
      )}
    </div>
  );
}
function CounselorDetail() {
  const { id } = useParams();
  const { data } = useApp();
  const c = data.counselors.find((c) => c.id === id);
  if (!c)
    return (
      <div className="container page">
        <Empty
          title="프로필을 찾을 수 없어요."
          text="전문가 목록에서 다시 선택해 주세요."
        />
        <Button to="/counselors">목록으로</Button>
      </div>
    );
  return (
    <div className="container page narrow">
      <Link to="/counselors" className="back">
        <ArrowLeft size={16} />
        전문가 목록
      </Link>
      {c.demo && (
        <Notice>
          구성 확인용 가상 상담사입니다. 실제 인물·자격·제공 일정을 뜻하지
          않습니다.
        </Notice>
      )}
      <div className="profile">
        <div className="avatar large">
          {c.name.slice(1)}
          <Leaf />
        </div>
        <p className="eyebrow">YOUR COUNSELOR</p>
        <h1>
          {c.name} <span>상담사</span>
        </h1>
        <p>{c.description}</p>
        <div className="tags">
          {c.fields.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>
      <div className="detail-grid">
        <article className="panel">
          <ShieldCheck />
          <h3>자격 정보</h3>
          <p>{c.qualifications}</p>
        </article>
        <article className="panel">
          <MapPin />
          <h3>만날 수 있는 지역</h3>
          <p>{c.regions.join(" · ")}</p>
        </article>
        <article className="panel">
          <MessageCircle />
          <h3>상담 비용</h3>
          <p>{c.fee}</p>
        </article>
        <article className="panel">
          <Clock />
          <h3>일정과 장소</h3>
          <p>신청 후 상담사와 협의하고, 결제 전에 정확히 안내합니다.</p>
        </article>
      </div>
      <Button to={"/request?counselor=" + c.id}>
        {c.demo ? "이 프로필로 매칭 흐름 체험" : "이 상담사로 매칭 신청"}
      </Button>
    </div>
  );
}
function Services() {
  return (
    <>
      <div className="container page">
        <PageIntro
          label="CARE THAT FITS YOU"
          title="필요한 도움은, 마음마다 다르니까."
        >
          대화와 자기이해의 시간을 나에게 맞는 방식으로 만나보세요.
        </PageIntro>
        <ServiceCards />
        <div className="service-details">
          <article id="individual">
            <span className="number">01</span>
            <h2>개인상담</h2>
            <p>
              일과 진로, 관계, 지친 마음. 상담사와 개별적으로 만나 지금 필요한
              이야기를 나눕니다.
            </p>
            <ul>
              <li>고민 주제에 맞는 상담사 연결</li>
              <li>가능한 지역·시간을 바탕으로 장소 협의</li>
              <li>회기 시간과 총비용을 제안서에서 먼저 확인</li>
            </ul>
            <Button to="/request?service=individual">개인상담 알아보기</Button>
          </article>
          <article id="assessment">
            <span className="number">02</span>
            <h2>심리검사</h2>
            <p>
              검사 결과와 전문가의 해석을 통해 자신을 살펴보는 시간입니다.
              목적에 맞는 검사 종류를 먼저 안내받습니다.
            </p>
            <ul>
              <li>신청 목적과 검사 적합성 확인</li>
              <li>검사 종류·실시 방법·해석 상담 안내</li>
              <li>검사비와 해석비 포함 여부를 결제 전 확인</li>
            </ul>
            <Button to="/request?service=assessment">심리검사 알아보기</Button>
          </article>
        </div>
        <article className="cost-note panel">
          <div>
            <p className="eyebrow">CLEAR FROM THE START</p>
            <h2>금액은, 먼저 분명하게.</h2>
            <p>
              상담사와 서비스에 따라 비용이 달라집니다.
              <br />
              회기 비용, 검사비, 장소 대관비를 포함한 총액을 제안받고
              결정하세요.
            </p>
          </div>
          <div>
            <span className="outline-label">결제 전 안내 항목</span>
            <p>
              상담사 · 서비스 내용 · 회기 시간
              <br />
              날짜 · 장소 · 총비용 · 변경·취소 조건
            </p>
            <small>
              확정되지 않은 요금을 정가나 할인가로 표시하지 않습니다.
            </small>
          </div>
        </article>
      </div>
      <FinalCTA />
    </>
  );
}
const programs = [
  [
    "마음 회복과 자기이해",
    "자기이해 워크숍, 감정 알아차리기, 작은 대화 모임",
    "arunia-self-understanding.jpg",
  ],
  [
    "관계와 일상으로 한 걸음",
    "자조모임, 요리·원예 활동, 함께하는 외출",
    "arunia-everyday-recovery.jpg",
  ],
  [
    "나의 다음 시작 준비",
    "진로 탐색, 기초 역량, 일 경험을 위한 준비",
    "arunia-small-group.jpg",
  ],
  [
    "가족도 함께 배우는 시간",
    "부모 교육과 가족 대화 프로그램",
    "arunia-individual.jpg",
  ],
];
const programIds = ["recovery", "connection", "career", "family"];
const programNames: Record<string, string> = Object.fromEntries(
  programIds.map((id, i) => [id, programs[i][0]]),
);
function Programs() {
  return (
    <div className="container page">
      <PageIntro label="GROW TOGETHER" title="함께라서 가능한 작은 변화.">
        마음을 알아가는 시간에서, 관계와 일상으로 한 걸음씩.
      </PageIntro>
      <Notice>
        아래는 준비 중인 프로그램 방향입니다. 모집 중인 일정이나 확정된 기관
        연계를 의미하지 않습니다.
      </Notice>
      <div className="program-grid">
        {programs.map(([title, text, img], i) => (
          <article className="program-card" key={title}>
            <img
              src={"/images/" + img}
              alt={title + " 프로그램 콘셉트"}
              loading="lazy"
            />
            <div>
              <span className="subtle-tag">준비 중 · 0{i + 1}</span>
              <h2>{title}</h2>
              <p>{text}</p>
              <Link
                to={"/request?service=group&program=" + programIds[i]}
                className="text-link"
              >
                관심 프로그램 알려주기
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
const faq = [
  [
    "어른이아는 어떤 서비스인가요?",
    "서울·경기에서 상담을 찾는 20·30대와 상담 전문가를 연결하는 서비스입니다. 원하는 주제와 지역·시간을 알려주시면 상담사와 일정, 장소, 총비용을 확인하는 과정을 거칩니다.",
  ],
  [
    "상담은 어디에서 하나요?",
    "고정된 상담센터가 있지 않습니다. 상담사와 내담자가 장소를 협의하며, 필요한 경우 대관 공간을 이용합니다. 예약 전에 정확한 위치와 공간 조건, 대화의 사생활 보호에 적합한지, 추가 비용 여부를 확인합니다.",
  ],
  [
    "신청하면 바로 결제되나요?",
    "아니요. 먼저 매칭 신청을 접수하고 상담 제안을 받습니다. 상담사·일정·장소·비용을 확인하고 제안을 수락한 뒤 결제 단계로 이동합니다.",
  ],
  [
    "상담사를 아직 고르지 못했어요.",
    "괜찮아요. 이야기하고 싶은 주제와 가능한 지역·시간을 알려주세요. 운영자가 해당 조건을 살펴보고 상담 전문가를 제안합니다. 모든 조건이 맞지 않을 수 있으며, 첫 만남 전에 충분히 확인하고 결정할 수 있습니다.",
  ],
  [
    "심리검사는 어떻게 진행하나요?",
    "상담 목적과 상황에 맞는 검사 종류, 실시 방법과 자격, 해석 상담 포함 여부를 확인한 뒤 진행합니다. 검사만으로 특정 결과나 진단을 보장하지 않습니다.",
  ],
  [
    "일정 변경이나 취소는 어떻게 하나요?",
    "결제 전 제안 내역과 변경·취소 조건을 확인해 주세요. 결제 전 신청은 마이페이지에서 취소할 수 있습니다. 결제 이후에는 마이페이지에서 변경·취소 요청을 남겨 주세요. 운영자가 내역을 확인하고 처리합니다. 현재 미리보기의 운영 정책은 초안이며 정식 공개 전에 확정할 예정입니다.",
  ],
];
function FAQ({ limit = 6 }: { limit?: number }) {
  return (
    <div className="faq-list" id="faq">
      {faq.slice(0, limit).map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <Plus size={19} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
function Guide() {
  return (
    <div className="container page narrow">
      <PageIntro label="BEFORE WE BEGIN" title="처음이라도, 어렵지 않도록.">
        신청부터 첫 만남까지. 천천히 따라와 주세요.
      </PageIntro>
      <div className="guide-steps">
        {[
          [
            "원하는 상담을 알려주세요",
            "회원가입 후 주제와 서비스, 가능한 지역·시간을 선택합니다. 상세한 건강 정보나 사적인 상담 기록은 신청서에 남기지 않아도 됩니다.",
          ],
          [
            "상담 제안을 확인해요",
            "운영자가 상담사와 일정·장소를 확인해 제안합니다. 자격과 회기 시간, 장소 비용 포함 여부, 총액과 변경·취소 조건을 살펴보세요.",
          ],
          [
            "함께 정한 만남을 예약해요",
            "마이페이지에서 제안을 수락하고 결제하면 예약이 확정됩니다. 제안이 맞지 않으면 결제 전 신청을 취소하고 조건을 다시 정할 수 있습니다.",
          ],
        ].map(([title, text], i) => (
          <article key={title}>
            <span>0{i + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
      <section className="panel space-note">
        <MapPin size={25} />
        <h2>편안하게 이야기할 수 있는 곳에서.</h2>
        <p>
          어른이아는 고정 센터를 운영하지 않습니다. 상담 장소는 그때그때
          협의합니다. 대관 공간을 이용할 때도 독립된 대화 환경과 접근성, 정확한
          위치·비용을 확인하는 절차가 필요합니다.
        </p>
        <p className="fine">
          공간 대관은 해당 업체와의 제휴나 공식 협업을 뜻하지 않습니다.
        </p>
      </section>
      <section className="section">
        <SectionHead eyebrow="FAQ" title="자주 묻는 질문" />
        <FAQ />
      </section>
      <Button to="/request">상담 시작하기</Button>
    </div>
  );
}
function About() {
  return (
    <>
      <section className="about-hero">
        <img
          src="/images/arunia-everyday-recovery.jpg"
          alt="녹음이 있는 산책길을 함께 걷는 두 사람의 콘셉트 사진"
        />
        <div>
          <p className="eyebrow">A LITTLE CLOSER TO YOURSELF</p>
          <h1>
            어른이 되는 일에는,
            <br />
            마음을 돌보는 일도
            <br />
            포함되니까.
          </h1>
        </div>
      </section>
      <div className="container page narrow">
        <p className="eyebrow">OUR REASON</p>
        <h2>
          혼자 해결해야 한다는 마음에,
          <br />
          함께라는 선택지를.
        </h2>
        <p className="lead">
          어른이아는 서울·경기 청년과 상담 전문가를 연결합니다. 나와 맞는 사람을
          찾고, 충분히 확인하고, 내 속도로 시작할 수 있도록 돕고 싶습니다.
        </p>
        <div className="values">
          <article>
            <ShieldCheck />
            <h3>신뢰는 구체적으로</h3>
            <p>자격·분야·비용·장소를 확인할 수 있는 정보를 준비합니다.</p>
          </article>
          <article>
            <Heart />
            <h3>사람을 중심에</h3>
            <p>
              좋은 만남을 위해 상황과 생활권, 원하는 대화의 방향을 살핍니다.
            </p>
          </article>
          <article>
            <Sprout />
            <h3>각자의 속도로</h3>
            <p>상담부터 작은 모임까지, 지금 필요한 방식으로 시작합니다.</p>
          </article>
        </div>
        <article className="panel" id="partnership">
          <p className="eyebrow">PARTNERSHIPS TO COME</p>
          <h2>함께할 기관을 기다립니다.</h2>
          <p>
            청년을 위한 심리지원·자기이해 프로그램을 함께 기획할 기관과 기업의
            협업을 준비하고 있습니다. 현재 확정된 협업 기관은 없습니다.
          </p>
          <p className="fine">
            협업 실적과 기관 로고는 실제 협약 및 로고 사용 허락을 확인한 후
            공개합니다. 제휴 담당 연락처는 정식 운영 정보와 함께 등록할
            예정입니다.
          </p>
        </article>
      </div>
    </>
  );
}
function Reviews() {
  const { data } = useApp();
  return (
    <div className="container page">
      <PageIntro label="TEN DIFFERENT DAYS" title="열 가지 일상, 열 가지 마음.">
        후기 화면을 살펴보기 위해 만든 가상의 이야기입니다.
      </PageIntro>
      <Notice>
        모든 이름과 경험은 화면 구성을 위한 가상 예시입니다. 실제 고객의 후기나
        서비스 효과가 아닙니다. 정식 운영 전 실제 동의를 받은 콘텐츠로
        교체합니다.
      </Notice>
      <div className="review-grid all-reviews">
        {data.testimonials.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </div>
      {!data.testimonials.length && (
        <Empty
          title="등록된 후기가 없습니다."
          text="동의를 받은 실제 경험이 준비되면 소개하겠습니다."
        />
      )}
    </div>
  );
}
function Protected({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { data } = useApp();
  const l = useLocation();
  if (!data.user)
    return (
      <Navigate
        to={"/login?next=" + encodeURIComponent(l.pathname + l.search)}
        replace
      />
    );
  if (admin && data.user.role !== "admin")
    return (
      <div className="container page">
        <Notice tone="error">운영자만 접근할 수 있습니다.</Notice>
      </div>
    );
  return <>{children}</>;
}
function Auth({ signup = false }: { signup?: boolean }) {
  const { data, refresh } = useApp();
  const navigate = useNavigate();
  const l = useLocation();
  const next = new URLSearchParams(l.search).get("next") || "/account";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setError("");
  }, [signup]);
  if (data.user) return <Navigate to={safeNext} replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await api(signup ? "/auth/register" : "/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
        ...(signup
          ? { name: form.get("name"), consent: form.get("consent") === "on" }
          : {}),
      });
      await refresh();
      navigate(safeNext, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page container">
      <div className="auth-story">
        <img
          src="/images/arunia-self-understanding.jpg"
          alt="마음을 정리할 수 있는 따뜻한 책상 콘셉트"
        />
        <div>
          <p className="eyebrow">WELCOME TO YOUR OWN PACE</p>
          <h2>
            나를 돌보는 시간,
            <br />
            여기서 시작해요.
          </h2>
        </div>
      </div>
      <div className="auth-form">
        <p className="eyebrow">HELLO, ARUNIA</p>
        <h1>{signup ? "반가워요." : "다시 만나 반가워요."}</h1>
        <p className="muted">
          {signup
            ? "나의 상담 여정을 함께 준비해요."
            : "이어서 나의 마음 여정을 살펴보세요."}
        </p>
        {data.demo && (
          <Notice>
            구성 확인용 계정만 만들어 주세요. 실제 개인정보 대신 테스트 정보를
            사용해 주세요.
          </Notice>
        )}
        <form onSubmit={submit}>
          {signup && (
            <label>
              이름
              <input
                required
                name="name"
                maxLength={40}
                autoComplete="name"
                placeholder="어떻게 불러드릴까요?"
              />
            </label>
          )}
          <label>
            이메일
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="hello@example.com"
            />
          </label>
          <label>
            비밀번호
            <input
              required
              name="password"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder="10자 이상 입력해 주세요"
            />
          </label>
          {signup && (
            <label className="checkbox">
              <input type="checkbox" name="consent" required />
              <span>
                <Link to="/terms" target="_blank">
                  이용약관
                </Link>
                과{" "}
                <Link to="/privacy" target="_blank">
                  개인정보 처리방침
                </Link>
                을 확인하고 동의합니다.
              </span>
            </label>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <button disabled={busy} className="button full">
            {busy ? "잠시만 기다려 주세요" : signup ? "회원가입" : "로그인"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {signup ? "이미 계정이 있나요?" : "처음 방문하셨나요?"}{" "}
          <Link
            to={
              (signup ? "/login" : "/signup") +
              "?next=" +
              encodeURIComponent(safeNext)
            }
          >
            {signup ? "로그인" : "회원가입"}
          </Link>
        </p>
      </div>
    </div>
  );
}
function Application() {
  const { data } = useApp();
  const l = useLocation();
  const query = new URLSearchParams(l.search);
  const nav = useNavigate();
  const [step, setStep] = useState(0),
    [service, setService] = useState(query.get("service") || "individual"),
    [selected, setSelected] = useState<string[]>(
      query.get("topic") ? [query.get("topic")!] : [],
    ),
    [region, setRegion] = useState("서울"),
    [district, setDistrict] = useState(""),
    [availability, setAvailability] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/requests", {
        service,
        topics: selected,
        region: region + " " + district,
        availability,
        preferredCounselor: query.get("counselor") || undefined,
        program:
          service === "group" ? query.get("program") || undefined : undefined,
        consent: form.get("consent") === "on",
        sensitiveConsent: form.get("sensitiveConsent") === "on",
      });
      nav("/account?submitted=1");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page form-page">
      <PageIntro
        label="LET’S FIND YOUR PERSON"
        title="지금의 마음을, 조금만 알려주세요."
      >
        상세한 이야기는 상담사와 직접 나눠도 괜찮아요.
      </PageIntro>
      {data.demo && (
        <Notice>
          테스트 신청입니다. 실제 예약으로 접수되지 않습니다. 민감한 개인정보는
          입력하지 마세요.
        </Notice>
      )}
      {service === "group" && query.get("program") && (
        <Notice>관심 프로그램: {programNames[query.get("program")!]}</Notice>
      )}
      <ol className="progress">
        {["마음과 서비스", "지역과 시간", "확인과 동의"].map((t, i) => (
          <li className={i <= step ? "active" : ""} key={t}>
            <span>{i < step ? <Check size={15} /> : i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
      <form className="panel application" onSubmit={submit}>
        {step === 0 && (
          <>
            <h2>어떤 도움이 필요하세요?</h2>
            <div className="choice-grid">
              {data.services.map((s) => (
                <button
                  type="button"
                  className={s.id === service ? "choice selected" : "choice"}
                  aria-pressed={s.id === service}
                  onClick={() => setService(s.id)}
                  key={s.id}
                >
                  <span>{s.name}</span>
                  <p>{s.description}</p>
                  {s.id === service && <Check size={17} />}
                </button>
              ))}
            </div>
            <h3>
              가까운 마음을 골라주세요. <small>최대 4개</small>
            </h3>
            <div className="pills large">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={selected.includes(t)}
                  className={selected.includes(t) ? "selected" : ""}
                  onClick={() =>
                    setSelected(
                      selected.includes(t)
                        ? selected.filter((x) => x !== t)
                        : selected.length < 4
                          ? [...selected, t]
                          : selected,
                    )
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="form-actions">
              <button
                type="button"
                disabled={!selected.length}
                className="button"
                onClick={() => setStep(1)}
              >
                다음
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2>어디서, 언제가 편하세요?</h2>
            <label>
              희망 지역
              <div className="input-row">
                <select
                  aria-label="광역 지역"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option>서울</option>
                  <option>경기</option>
                </select>
                <input
                  required
                  aria-label="시 또는 구"
                  value={district}
                  maxLength={30}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="예: 마포구, 수원시"
                />
              </div>
            </label>
            <label>
              가능한 요일과 시간
              <input
                required
                value={availability}
                maxLength={120}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="예: 평일 오후 7시 이후 / 토요일 오전"
              />
            </label>
            <Notice>
              고정 상담센터가 없습니다. 구체적인 장소와 공간 비용은 상담
              제안에서 안내받고 결정합니다.
            </Notice>
            <div className="form-actions split">
              <button
                className="text-link"
                type="button"
                onClick={() => setStep(0)}
              >
                <ArrowLeft size={16} />
                이전
              </button>
              <button
                type="button"
                className="button"
                disabled={!district.trim() || !availability.trim()}
                onClick={() => setStep(2)}
              >
                다음
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2>이렇게 시작해볼까요?</h2>
            <dl className="summary-list">
              <div>
                <dt>서비스</dt>
                <dd>{serviceNames[service]}</dd>
              </div>
              <div>
                <dt>이야기 주제</dt>
                <dd>{selected.join(" · ")}</dd>
              </div>
              <div>
                <dt>희망 지역</dt>
                <dd>
                  {region} {district}
                </dd>
              </div>
              <div>
                <dt>가능한 시간</dt>
                <dd>{availability}</dd>
              </div>
            </dl>
            <p className="muted">
              운영자가 조건을 확인해 제안합니다. 아직 상담 예약이나 결제가
              이루어지지 않습니다.
            </p>
            <label className="checkbox">
              <input type="checkbox" name="consent" required />
              <span>
                매칭을 위한 서비스·지역·시간 정보의 수집·이용에 동의합니다.{" "}
                <Link to="/privacy" target="_blank">
                  항목·보관 기준 확인
                </Link>
              </span>
            </label>
            <label className="checkbox">
              <input type="checkbox" name="sensitiveConsent" required />
              <span>
                선택한 마음·고민 주제에 민감정보가 포함될 수 있음을 확인하고,
                매칭을 위한 수집·이용에 별도로 동의합니다.
              </span>
            </label>
            <p className="fine">
              현재 신청 내용은 운영 담당자가 확인합니다. 정식 운영 전 상담사
              전달 범위·절차를 확정합니다.
            </p>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="form-actions split">
              <button
                className="text-link"
                type="button"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} />
                이전
              </button>
              <button className="button" disabled={busy}>
                {busy
                  ? "접수 중…"
                  : data.demo
                    ? "테스트 매칭 신청"
                    : "매칭 신청하기"}
                <ArrowUpRight size={17} />
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Sprout size={40} strokeWidth={1.2} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Account() {
  const { data, refresh } = useApp();
  const { value, error, reload } = useLoad<{ requests: RequestItem[] }>(
    "/requests",
  );
  const [actionError, setActionError] = useState(""),
    [passwordMessage, setPasswordMessage] = useState("");
  const navigate = useNavigate();
  async function action(url: string, body = {}) {
    setActionError("");
    try {
      await api(url, body);
      await reload();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }
  async function pay(r: RequestItem) {
    try {
      const o = await api("/orders", { requestId: r.id });
      navigate("/checkout/" + o.id);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }
  return (
    <div className="container page narrow">
      <PageIntro
        label="MY LITTLE JOURNEY"
        title={`${data.user?.name}님, 오늘의 마음은 어떤가요?`}
      >
        나의 신청과 상담 제안을 이곳에서 확인하세요.
      </PageIntro>
      {new URLSearchParams(useLocation().search).has("submitted") && (
        <Notice>
          신청이 접수되었어요. 운영자가 확인한 후 이 화면에 제안을 등록합니다.
          {data.demo ? " 현재는 테스트 신청입니다." : ""}
        </Notice>
      )}
      <div className="section-head">
        <h2>나의 상담 여정</h2>
        <Link className="text-link" to="/request">
          새 상담 신청
          <Plus size={16} />
        </Link>
      </div>
      {(error || actionError) && (
        <Notice tone="error">{error || actionError}</Notice>
      )}
      {!value && !error && <p role="status">내역을 불러오고 있어요…</p>}
      {value?.requests.length === 0 && (
        <>
          <Empty
            title="아직 시작한 상담이 없어요."
            text="편안한 때, 첫 이야기를 들려주세요."
          />
          <Button to="/request">나에게 맞는 상담 찾기</Button>
        </>
      )}
      {value?.requests.map((r) => (
        <article className="request-card" key={r.id}>
          <div className="request-title">
            <div>
              <span className={"status status-" + r.status}>
                {statuses[r.status]}
              </span>
              <h3>{serviceNames[r.data.service]}</h3>
            </div>
            <small>{date(r.created)} 신청</small>
          </div>
          <p>
            {r.data.topics.join(" · ")}
            {r.data.program && <> · {programNames[r.data.program]}</>}
          </p>
          <div className="tags">
            <span>
              <MapPin size={13} />
              {r.data.region}
            </span>
            <span>
              <Clock size={13} />
              {r.data.availability}
            </span>
          </div>
          {r.counselor && (
            <div className="offer">
              <h4>
                도착한 상담 제안{" "}
                {r.counselor.demo && (
                  <span className="demo-tag">가상 제안</span>
                )}
              </h4>
              <dl className="summary-list">
                <div>
                  <dt>상담사</dt>
                  <dd>
                    {r.counselor.name} · {r.counselor.qualifications}
                  </dd>
                </div>
                <div>
                  <dt>일정</dt>
                  <dd>{date(r.slot)}</dd>
                </div>
                <div>
                  <dt>장소</dt>
                  <dd>{r.location}</dd>
                </div>
                <div>
                  <dt>시간·포함 내역</dt>
                  <dd>{r.venue_note}</dd>
                </div>
                <div>
                  <dt>총비용</dt>
                  <dd>
                    <strong>{money(r.amount)}</strong>
                  </dd>
                </div>
              </dl>
              {["offered", "accepted"].includes(r.status) && (
                <p className="fine">
                  수락·결제 기한: {date(r.offer_expires)} ·{" "}
                  <Link to="/terms">변경·취소 정책</Link>을 확인해 주세요.
                </p>
              )}
            </div>
          )}
          <div className="card-actions">
            {r.status === "offered" && (
              <button
                className="button"
                onClick={() =>
                  action("/requests/" + r.id + "/accept", {
                    revision: r.offer_revision,
                  })
                }
              >
                제안 확인·수락
                <Check size={16} />
              </button>
            )}
            {r.status === "accepted" && (
              <button className="button" onClick={() => pay(r)}>
                결제 단계로
                <ArrowRight size={16} />
              </button>
            )}
            {["pending", "offered", "accepted"].includes(r.status) &&
              (!r.order || ["pending", "failed"].includes(r.order.status)) && (
                <button
                  className="text-link"
                  onClick={() => action("/requests/" + r.id + "/cancel")}
                >
                  신청 취소
                </button>
              )}
            {r.order && (
              <Link className="text-link" to={"/checkout/" + r.order.id}>
                결제 내역
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
          <Support r={r} onSave={reload} />
          {r.order?.provider === "mock" && (
            <p className="fine">테스트 결제 내역 · 실제 청구 없음</p>
          )}
        </article>
      ))}
      <details className="account-settings">
        <summary>
          계정 설정
          <ChevronDown size={16} />
        </summary>
        <p>{data.user?.email}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPasswordMessage("");
            const f = new FormData(e.currentTarget);
            try {
              await api("/auth/password", {
                current: f.get("current"),
                password: f.get("password"),
              });
              setPasswordMessage(
                "비밀번호가 변경되었습니다. 다른 기기의 로그인은 해제됩니다.",
              );
            } catch (e) {
              setPasswordMessage((e as Error).message);
            }
          }}
        >
          <h3>비밀번호 변경</h3>
          <label>
            현재 비밀번호
            <input
              type="password"
              required
              name="current"
              autoComplete="current-password"
            />
          </label>
          <label>
            새 비밀번호
            <input
              type="password"
              required
              minLength={10}
              maxLength={128}
              name="password"
              autoComplete="new-password"
            />
          </label>
          {passwordMessage && <Notice>{passwordMessage}</Notice>}
          <button className="button secondary">변경하기</button>
        </form>
        <button
          className="text-link"
          onClick={async () => {
            await api("/auth/logout", {});
            await refresh();
          }}
        >
          로그아웃
          <LogOut size={16} />
        </button>
      </details>
    </div>
  );
}
type OrderData = {
  order: {
    id: string;
    status: string;
    provider: string;
    amount: number;
    receipt?: string;
  };
  request: RequestItem;
  clientKey: string;
  customerKey: string;
};
declare global {
  interface Window {
    TossPayments?: any;
  }
}
let sdkPromise: Promise<void> | undefined;
function loadToss() {
  if (window.TossPayments) return Promise.resolve();
  if (!sdkPromise)
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://js.tosspayments.com/v2/standard";
      s.onload = () => resolve();
      s.onerror = () => {
        sdkPromise = undefined;
        reject(
          new Error("결제 화면을 불러오지 못했습니다. 다시 시도해 주세요."),
        );
      };
      document.head.appendChild(s);
    });
  return sdkPromise;
}
function Checkout() {
  const { id } = useParams();
  const { value, error, reload } = useLoad<OrderData>("/orders/" + id);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [widgets, setWidgets] = useState<any>(null);
  useEffect(() => {
    if (
      !value ||
      value.order.provider === "mock" ||
      value.order.status !== "pending"
    )
      return;
    let cancelled = false;
    let methods: any, agreement: any;
    (async () => {
      try {
        await loadToss();
        if (cancelled) return;
        const w = window
          .TossPayments(value.clientKey)
          .widgets({ customerKey: value.customerKey });
        await w.setAmount({ currency: "KRW", value: value.order.amount });
        methods = await w.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        });
        agreement = await w.renderAgreement({
          selector: "#payment-agreement",
          variantKey: "AGREEMENT",
        });
        if (cancelled) {
          methods?.destroy();
          agreement?.destroy();
          return;
        }
        setWidgets(w);
      } catch (e) {
        setMessage((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      methods?.destroy();
      agreement?.destroy();
      setWidgets(null);
    };
  }, [value?.order.id, value?.order.status]);
  async function action(kind: string) {
    setBusy(true);
    setMessage("");
    try {
      await api("/orders/" + id + "/" + kind, {});
      await reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <div className="container page narrow">
        <Notice tone="error">{error}</Notice>
      </div>
    );
  if (!value)
    return (
      <div className="container page narrow" role="status">
        결제 내역을 불러오고 있어요…
      </div>
    );
  const { o, r } = { o: value.order, r: value.request };
  const isPaid = o.status === "paid";
  return (
    <div className="container page narrow">
      <Link className="back" to="/account">
        <ArrowLeft size={16} />
        마이페이지
      </Link>
      <PageIntro
        label="YOUR APPOINTMENT"
        title={
          isPaid
            ? "만남이 준비되었어요."
            : o.status === "refunded"
              ? "결제가 취소되었어요."
              : "확인한 제안으로 시작해요."
        }
      >
        {o.provider === "mock"
          ? "미리보기 결제 · 실제 금액이 청구되지 않습니다."
          : o.provider === "toss_test"
            ? "토스페이먼츠 테스트 환경입니다."
            : "예약 내용을 다시 한번 확인해 주세요."}
      </PageIntro>
      <article className="panel checkout-summary">
        {isPaid && <CheckCircle2 className="success-icon" size={40} />}
        <span className="status">{statuses[o.status] || "결제 대기"}</span>
        <h2>{serviceNames[r.data.service]}</h2>
        <dl className="summary-list">
          <div>
            <dt>상담사</dt>
            <dd>{r.counselor?.name}</dd>
          </div>
          <div>
            <dt>일정</dt>
            <dd>{date(r.slot)}</dd>
          </div>
          <div>
            <dt>장소</dt>
            <dd>{r.location}</dd>
          </div>
          <div>
            <dt>시간·포함 내역</dt>
            <dd>{r.venue_note}</dd>
          </div>
          <div className="total">
            <dt>총 결제 금액</dt>
            <dd>{money(o.amount)}</dd>
          </div>
        </dl>
        {o.provider === "mock" && (
          <Notice>
            테스트용 예약·결제 내역입니다. 실제 상담 일정이 확정된 것은
            아닙니다.
          </Notice>
        )}
      </article>
      {message && <Notice tone="error">{message}</Notice>}
      {o.status === "failed" && (
        <>
          <Notice>
            결제사에서 승인되지 않은 결제로 확인했습니다. 같은 상담 제안으로 새
            결제를 만들 수 있습니다.
          </Notice>
          <Link className="button" to="/account">
            마이페이지에서 다시 결제하기
          </Link>
        </>
      )}
      {o.status === "pending" && (
        <>
          <div id="payment-method" />
          <div id="payment-agreement" />
          <p className="fine">
            제안에 포함된 서비스와 총비용,{" "}
            <Link to="/terms">변경·취소 조건</Link>을 확인한 후 진행하세요.
          </p>
          {o.provider === "mock" ? (
            <button
              disabled={busy}
              className="button full"
              onClick={() => action("mock")}
            >
              {busy ? "처리 중…" : "테스트 결제 완료하기 (실제 청구 없음)"}
              <LockKeyhole size={17} />
            </button>
          ) : (
            <button
              className="button full"
              disabled={!widgets || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await widgets.requestPayment({
                    orderId: o.id,
                    orderName: "어른이아 " + serviceNames[r.data.service],
                    successUrl: window.location.origin + "/payment/success",
                    failUrl: window.location.origin + "/payment/fail",
                  });
                } catch (e) {
                  setMessage((e as Error).message);
                  setBusy(false);
                }
              }}
            >
              {money(o.amount)} 결제하기
              <LockKeyhole size={17} />
            </button>
          )}
        </>
      )}
      {["confirming", "reconciliation_required", "refund_pending"].includes(
        o.status,
      ) && (
        <>
          <Notice>
            결제 결과를 확인하고 있습니다. 새 주문을 만들지 말고 아래에서 기존
            결제 상태를 확인해 주세요.
          </Notice>
          <button
            disabled={busy}
            className="button"
            onClick={() => action("reconcile")}
          >
            결제 상태 확인
          </button>
        </>
      )}
      {isPaid && o.receipt && (
        <a
          className="text-link"
          href={o.receipt}
          target="_blank"
          rel="noreferrer"
        >
          결제 영수증
          <ArrowUpRight size={16} />
        </a>
      )}
      <div className="card-actions">
        <Button to="/account" light>
          나의 상담 여정으로
        </Button>
      </div>
    </div>
  );
}
function PaymentResult() {
  const q = new URLSearchParams(useLocation().search),
    navigate = useNavigate();
  const [error, setError] = useState("");
  const orderId = q.get("orderId");
  useEffect(() => {
    if (!orderId || !q.get("paymentKey") || !q.get("amount")) {
      setError("결제 확인 정보가 누락되었습니다.");
      return;
    }
    api("/payments/confirm", {
      orderId,
      paymentKey: q.get("paymentKey"),
      amount: Number(q.get("amount")),
    })
      .then(() =>
        navigate("/checkout/" + encodeURIComponent(orderId), { replace: true }),
      )
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="container page narrow">
      <PageIntro
        label="PAYMENT CONFIRMATION"
        title="결제 결과를 확인하고 있어요."
      />
      {error ? (
        <>
          <Notice tone="error">{error}</Notice>
          {orderId && (
            <Button to={"/checkout/" + encodeURIComponent(orderId)}>
              주문 상태 확인
            </Button>
          )}
        </>
      ) : (
        <p role="status">잠시만 기다려 주세요. 승인 결과를 확인합니다.</p>
      )}
    </div>
  );
}
function PaymentFailure() {
  return (
    <div className="container page narrow">
      <PageIntro
        label="PAYMENT NOT COMPLETED"
        title="결제가 완료되지 않았어요."
      >
        결제 창을 닫았거나 승인 과정에서 문제가 생겼습니다. 기존 주문에서 다시
        확인해 주세요.
      </PageIntro>
      <Button to="/account">마이페이지로</Button>
    </div>
  );
}
function Admin() {
  const { value, error, reload } = useLoad<{
    requests: RequestItem[];
    counselors: Counselor[];
    audit: { id: string; action: string; created: string; object_id: string }[];
  }>("/admin");
  const { refresh, data } = useApp();
  const [message, setMessage] = useState(""),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(false);
  async function action(url: string, body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      await api(url, body);
      await reload();
      await refresh();
      setMessage("변경사항을 저장했습니다.");
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <PageIntro label="ARUNIA OPERATIONS" title="좋은 만남을 준비하는 곳.">
        신청 확인 → 상담사·장소·비용 제안 → 이용자 수락 → 결제 확인
      </PageIntro>
      {data.demo && (
        <Notice>
          미리보기 운영 화면입니다. 실무를 맡는 운영자만 접근할 수 있습니다.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="admin-stats">
        {[
          ["pending", "새 신청"],
          ["offered", "제안 전달"],
          ["accepted", "결제 대기"],
          ["confirmed", "예약 확정"],
        ].map(([s, label]) => (
          <button
            className={filter === s ? "selected" : ""}
            key={s}
            onClick={() => setFilter(filter === s ? "all" : s)}
          >
            <span>{label}</span>
            <strong>
              {value?.requests.filter((r) => r.status === s).length || 0}
            </strong>
          </button>
        ))}
      </div>
      <div className="section-head">
        <h2>상담 신청 {filter !== "all" && "· " + statuses[filter]}</h2>
        <button
          className="text-link"
          onClick={() => {
            setFilter("all");
            void reload();
          }}
        >
          전체 보기·새로고침
        </button>
      </div>
      {value?.requests
        .filter((r) => filter === "all" || r.status === filter)
        .map((r) => (
          <article className="request-card admin-request" key={r.id}>
            <div className="request-title">
              <div>
                <span className="status">{statuses[r.status]}</span>
                <h3>
                  {r.member_name} · {serviceNames[r.data.service]}
                </h3>
                <small>{r.member_email}</small>
              </div>
              <small>{date(r.created)}</small>
            </div>
            <p>
              {r.data.topics.join(" · ")} / {r.data.region} /{" "}
              {r.data.availability}
              {r.data.program && <> · {programNames[r.data.program]}</>}
            </p>
            {(["pending", "offered"].includes(r.status) ||
              (r.status === "accepted" &&
                Date.parse(r.offer_expires) < Date.now())) && (
              <form
                className="offer-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await action("/admin/requests/" + r.id + "/offer", {
                    counselorId: f.get("counselorId"),
                    amount: Number(f.get("amount")),
                    slot: new Date(String(f.get("slot"))).toISOString(),
                    location: f.get("location"),
                    venueNote: f.get("venueNote"),
                  });
                }}
              >
                <label>
                  상담사
                  <select
                    name="counselorId"
                    required
                    defaultValue={r.counselor?.id || ""}
                  >
                    <option value="" disabled>
                      상담 전문가 선택
                    </option>
                    {value.counselors.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.demo ? "[예시] " : ""}
                        {c.name} · {c.fields.join(", ")} ·{" "}
                        {c.regions.join(", ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  상담 일시
                  <input name="slot" type="datetime-local" required />
                </label>
                <label>
                  총비용 (원)
                  <input
                    name="amount"
                    type="number"
                    required
                    min={100}
                    max={5000000}
                    step={1}
                    defaultValue={r.amount || undefined}
                    placeholder="확정한 총액"
                  />
                </label>
                <label>
                  정확한 장소
                  <input
                    name="location"
                    required
                    maxLength={250}
                    defaultValue={r.location || ""}
                    placeholder="주소·층·호수 포함"
                  />
                </label>
                <label className="wide">
                  회기 시간·비용 포함 내역
                  <input
                    name="venueNote"
                    required
                    maxLength={250}
                    defaultValue={r.venue_note || ""}
                    placeholder="예: 50분 개인상담, 장소 대관비 포함 / 변경·취소 조건 안내"
                  />
                </label>
                <div className="wide">
                  <button className="button" disabled={busy}>
                    상담 제안 전달
                    <ArrowUpRight size={16} />
                  </button>
                  <span className="fine">
                    수락 후에는 금액·장소를 바꿀 수 없습니다.
                  </span>
                </div>
              </form>
            )}
            {r.counselor && (
              <p className="fine">
                현재 제안: {r.counselor.name} · {date(r.slot)} · {r.location} ·{" "}
                {money(r.amount)}
              </p>
            )}
            <Support r={r} admin onSave={reload} />
            <div className="card-actions">
              {r.status === "confirmed" && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    action("/admin/requests/" + r.id + "/complete", {})
                  }
                >
                  상담 완료 처리
                </button>
              )}
              {r.order &&
                ["paid", "refund_pending"].includes(r.order.status) && (
                  <form
                    className="refund-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      await action("/admin/orders/" + r.order!.id + "/refund", {
                        reason: f.get("reason"),
                      });
                    }}
                  >
                    <input
                      aria-label="결제 취소 사유"
                      name="reason"
                      required
                      minLength={1}
                      maxLength={200}
                      placeholder="전액 취소 사유 입력"
                    />
                    <button className="button secondary" disabled={busy}>
                      전액 결제 취소
                    </button>
                  </form>
                )}
              {r.order &&
                [
                  "confirming",
                  "reconciliation_required",
                  "refund_pending",
                ].includes(r.order.status) && (
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() =>
                      action("/admin/orders/" + r.order!.id + "/reconcile", {})
                    }
                  >
                    결제사 상태 재확인
                  </button>
                )}
            </div>
          </article>
        ))}
      {value?.requests.length === 0 && (
        <Empty
          title="새로운 신청을 기다리고 있어요."
          text="이용자의 신청이 접수되면 이곳에 표시됩니다."
        />
      )}
      <details className="admin-details">
        <summary>
          상담사 등록·관리
          <ChevronDown size={18} />
        </summary>
        <p>
          실제 자격과 소개 문구, 본인의 게시 동의를 확인한 상담사만 등록해
          주세요.
        </p>
        <form
          className="offer-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            const ok = await action("/admin/counselors", {
              name: f.get("name"),
              fields: String(f.get("fields"))
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
              regions: String(f.get("regions"))
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
              qualifications: f.get("qualifications"),
              description: f.get("description"),
              fee: f.get("fee"),
              demo: f.get("demo") === "on",
            });
            if (ok) form.reset();
          }}
        >
          {[
            ["name", "이름"],
            ["fields", "상담 분야 (쉼표로 구분)"],
            ["regions", "활동 지역 (쉼표로 구분)"],
            ["qualifications", "확인된 자격·발급기관"],
            ["description", "상담 소개"],
            ["fee", "요금 안내"],
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input
                required
                name={name}
                maxLength={name === "description" ? 500 : 120}
              />
            </label>
          ))}
          {data.demo && (
            <label className="checkbox">
              <input type="checkbox" name="demo" defaultChecked />
              <span>구성 확인용 가상 상담사</span>
            </label>
          )}
          <label className="checkbox">
            <input type="checkbox" required />
            <span>실제 등록 정보 또는 구성용 예시 여부를 확인했습니다.</span>
          </label>
          <div className="wide">
            <button className="button" disabled={busy}>
              상담사 등록
              <Plus size={16} />
            </button>
          </div>
        </form>
        <div className="roster">
          {value?.counselors.map((c) => (
            <div key={c.id}>
              <span>
                {c.name} {c.demo && <small>가상 예시</small>}
              </span>
              <span>{c.fields.join(" · ")}</span>
              <button
                className="text-link"
                disabled={busy}
                onClick={() =>
                  action("/admin/counselors/" + c.id + "/archive", {})
                }
              >
                비활성화
              </button>
            </div>
          ))}
        </div>
      </details>
      <details className="admin-details">
        <summary>
          최근 운영 기록
          <ChevronDown size={18} />
        </summary>
        <div className="audit-log">
          {value?.audit.map((a) => (
            <p key={a.id}>
              {date(a.created)} · {a.action} ·{" "}
              <code>{a.object_id.slice(0, 8)}</code>
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}
function Policy({ privacy = false }: { privacy?: boolean }) {
  const { data } = useApp();
  return (
    <div className="container page narrow policy">
      <PageIntro
        label="CLEAR & CAREFUL"
        title={privacy ? "개인정보 처리방침" : "이용약관·취소 안내"}
      />
      <Notice>
        운영 검토용 초안 · 실제 운영 주체, 담당 연락처, 보관·파기 기준과 취소
        정책을 확정한 뒤 정식 서비스를 열어야 합니다.
      </Notice>
      {privacy ? (
        <>
          <h2>수집하는 정보와 목적</h2>
          <p>
            계정 생성 시 이름·이메일·암호화된 비밀번호를 저장합니다. 로그인
            유지를 위해 세션 쿠키를 사용합니다. 매칭 신청 시 선택한 주제·희망
            지역·시간·서비스와 동의 시점을 저장하며, 신청 처리와 상담 제안
            확인에 이용합니다.
          </p>
          <h2>마음·고민 주제와 별도 동의</h2>
          <p>
            선택한 주제에 건강 등 민감한 정보가 포함될 수 있어 별도로 동의를
            받습니다. 자유 형식의 상세 상담 기록, 주민등록번호, 진단서 등은 이
            신청서에서 수집하지 않습니다.
          </p>
          <h2>누가 확인하나요?</h2>
          <p>
            계정 소유자는 본인의 신청과 결제 내역을, 권한이 부여된 운영자는
            매칭에 필요한 정보를 확인합니다. 현재 상담사에게 정보를 자동
            전송하는 기능은 없습니다. 정식 운영 전 전달 대상·항목·목적과 처리
            근거를 구체적으로 확정합니다.
          </p>
          <h2>결제 정보</h2>
          <p>
            토스페이먼츠 연결 시 결제창에서 결제 수단을 입력합니다. 사이트
            서버는 카드 번호를 직접 저장하지 않으며 주문 번호·금액·처리
            상태·결제사 식별값을 저장합니다. 현재{" "}
            {data.demo
              ? "미리보기에서는 실제 결제가 발생하지 않습니다."
              : "설정된 결제 환경에 따라 처리됩니다."}
          </p>
          <h2>보관·파기 및 권리 행사</h2>
          <p>
            현재는 검토 환경으로, 실제 고객 정보를 입력하지 않습니다. 공개 전
            계정·매칭·결제 각각의 법적 근거와 보관 기간, 파기 절차, 위탁·국외
            이전 여부와 개인정보 담당 연락처를 확정해야 합니다. 운영자에게
            요청하는 계정 삭제·정보 열람의 처리 절차도 함께 마련합니다.
          </p>
        </>
      ) : (
        <>
          <h2>서비스의 범위</h2>
          <p>
            어른이아는 이용자와 상담 전문가의 연결을 돕는 서비스입니다. 고정
            상담센터를 운영하지 않으며, 개인상담·심리검사·프로그램의 구체적인
            제공 범위와 시간·장소·비용은 상담 제안에서 확인합니다.
          </p>
          <h2>신청과 예약</h2>
          <p>
            신청만으로 결제가 발생하지 않습니다. 상담사, 일정, 정확한 장소, 회기
            시간과 총비용을 확인한 뒤 제안을 수락하고 결제합니다. 제안은 표시된
            기한까지 유효합니다.
          </p>
          <h2>변경·취소와 환불</h2>
          <p>
            결제 주문이 생성되기 전에는 마이페이지에서 신청을 취소할 수
            있습니다. 이후의 변경·취소는 마이페이지의 변경·취소 요청으로
            접수하며 운영자가 내역을 확인해 처리합니다. 결제 취소 기능은 전액
            취소를 지원하며, 실제 환불 도착 시점은 결제 수단과 결제사에 따라
            달라질 수 있습니다.
          </p>
          <p>
            시점별 취소 기준, 부분 환불 계산, 일정 변경 횟수 등 실제 운영 정책은
            아직 확정되지 않았습니다. 이 초안 상태에서는 정식 유료 판매를 열지
            않습니다.
          </p>
          <h2>구성용 콘텐츠</h2>
          <p>
            가상 상담사와 후기에는 구성 확인용 표시가 붙어 있습니다. 사진은 AI로
            제작한 콘셉트 이미지로 실제 상담사·내담자·전용 상담 공간을 의미하지
            않습니다. 특정 효과나 결과를 보장하지 않습니다.
          </p>
          <h2>운영 정보</h2>
          <p>
            사업자 정보, 고객 지원 연락처, 서비스 제공 책임과 실제 운영 정책은
            정식 공개 전에 등록합니다. 현재 구현은 검토를 위한 미리보기입니다.
          </p>
        </>
      )}
      <p className="fine">초안 버전: 2026-09-17</p>
    </div>
  );
}
function App() {
  const [data, setData] = useState<Bootstrap | null>(null),
    [error, setError] = useState("");
  const refresh = async () => {
    const v = await api<Bootstrap>("/bootstrap");
    setData(v);
    setError("");
  };
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  if (error)
    return (
      <div className="container page">
        <Brand />
        <h1>화면을 준비하지 못했어요.</h1>
        <Notice tone="error">
          서버 연결과 운영 설정을 확인해 주세요. {error}
        </Notice>
        <button
          className="button"
          onClick={() => refresh().catch((e) => setError(e.message))}
        >
          다시 불러오기
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="loading" role="status">
        <Brand />
        <p>당신의 마음을 위한 공간을 준비하고 있어요.</p>
      </div>
    );
  return (
    <AppContext.Provider value={{ data, refresh }}>
      <Shell />
    </AppContext.Provider>
  );
}

class AppErrorBoundary extends React.Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="container page" role="alert">
          <p className="eyebrow">ARUNIA</p>
          <h1>화면을 다시 준비할게요.</h1>
          <p className="muted">
            화면을 불러오는 중 문제가 생겼어요. 아래에서 다시 시작해 주세요.
          </p>
          <a className="button" href="/">
            홈 다시 불러오기
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

// The loading and error screens also contain links, so routing must exist
// before App's first render, not only after the bootstrap request completes.
createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppErrorBoundary>,
);

function Support({
  r,
  admin = false,
  onSave,
}: {
  r: RequestItem;
  admin?: boolean;
  onSave: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (
    !r.support?.length &&
    (admin || !["accepted", "confirmed", "completed"].includes(r.status))
  )
    return null;
  return (
    <details className="support-box">
      <summary>
        {admin ? "이용자의 변경·취소 요청" : "예약 변경·취소 요청"}
        {r.support?.some((s) => s.status === "open") && (
          <span className="status">접수됨</span>
        )}
        <ChevronDown size={15} />
      </summary>
      {r.support?.map((s) => (
        <div className="support-item" key={s.id}>
          <p>
            <strong>{s.kind === "cancel" ? "취소 요청" : "변경 요청"}</strong> ·{" "}
            {s.status === "open" ? "운영자 확인 중" : "처리 완료"}{" "}
            <small>{date(s.created)}</small>
          </p>
          <p>{s.note}</p>
          {admin && s.status === "open" && (
            <button
              disabled={busy}
              className="text-link"
              onClick={async () => {
                setBusy(true);
                try {
                  await api("/admin/support/" + s.id + "/resolve", {});
                  await onSave();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              처리 완료 표시
            </button>
          )}
        </div>
      ))}
      {!admin &&
        !r.support?.some((s) => s.status === "open") &&
        ["accepted", "confirmed", "completed"].includes(r.status) && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              try {
                await api("/requests/" + r.id + "/support", {
                  kind: f.get("kind"),
                  note: f.get("note"),
                });
                await onSave();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              요청 종류
              <select name="kind">
                <option value="change">일정·장소 변경</option>
                <option value="cancel">예약·결제 취소</option>
              </select>
            </label>
            <label>
              전달할 내용
              <input
                name="note"
                required
                maxLength={300}
                placeholder="희망 일정 또는 취소 사유만 간단히 적어 주세요"
              />
            </label>
            <p className="fine">
              상세한 상담 내용은 적지 마세요. 요청 접수만으로 일정이나 환불이
              확정되지 않으며 운영자가 확인합니다.
            </p>
            <button className="button secondary" disabled={busy}>
              {busy ? "접수 중…" : "요청 전달하기"}
            </button>
          </form>
        )}
      {error && <Notice tone="error">{error}</Notice>}
    </details>
  );
}
