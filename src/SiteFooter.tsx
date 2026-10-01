import { ArrowUpRight, Leaf, LogOut, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import "./site-footer.css";

type SiteFooterProps = {
  isAdmin: boolean;
  signedIn: boolean;
  onLogout: () => void;
};

const businessDetails = [
  ["사업자명", "어른이아 · 사업자명 등록 예정"],
  ["대표자", "등록 예정"],
  ["사업자등록번호", "등록 예정"],
  ["통신판매업 신고번호", "등록 예정"],
  ["문의 연락처", "등록 예정"],
  ["사업장 주소", "등록 예정"],
];

export default function SiteFooter({
  isAdmin,
  signedIn,
  onLogout,
}: SiteFooterProps) {
  return (
    <footer className="af-footer">
      <div className="container af-inner">
        <div className="af-top">
          <div className="af-brand-block">
            <Link className="af-brand" to="/" aria-label="어른이아 홈으로">
              <span className="af-brand-mark" aria-hidden="true">
                <Leaf size={27} strokeWidth={1.5} />
              </span>
              <span>어른이아</span>
            </Link>
            <p className="af-tagline">
              어른이 되어가는 모든 날에,
              <br />
              마음을 나눌 한 사람이 있도록.
            </p>
            <p className="af-description">
              서울·경기의 20·30대와 상담 전문가를 연결합니다.
              <br />
              나에게 맞는 만남을, 나의 속도로 시작해 보세요.
            </p>
            <Link className="af-explore" to="/counselors">
              나에게 맞는 상담 알아보기
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <nav className="af-nav" aria-label="하단 메뉴">
            <section className="af-nav-group" aria-labelledby="af-services">
              <h2 id="af-services">상담 안내</h2>
              <ul>
                <li>
                  <Link to="/services">상담 서비스</Link>
                </li>
                <li>
                  <Link to="/counselors">상담 전문가</Link>
                </li>
                <li>
                  <Link to="/programs">함께하는 프로그램</Link>
                </li>
              </ul>
            </section>
            <section className="af-nav-group" aria-labelledby="af-guide">
              <h2 id="af-guide">이용 안내</h2>
              <ul>
                <li>
                  <Link to="/guide">처음 이용하시나요?</Link>
                </li>
                <li>
                  <Link to="/reviews">마음 이야기</Link>
                </li>
                <li>
                  <Link to="/guide#faq">자주 묻는 질문</Link>
                </li>
              </ul>
            </section>
            <section className="af-nav-group" aria-labelledby="af-about">
              <h2 id="af-about">어른이아</h2>
              <ul>
                <li>
                  <Link to="/about">우리가 함께하는 이유</Link>
                </li>
                <li>
                  <Link to="/about#partnership">기관·기업 협업 문의</Link>
                </li>
              </ul>
            </section>
          </nav>
        </div>

        <div className="af-meeting-note">
          <MapPin size={20} aria-hidden="true" />
          <p>
            <strong>상담 가능 지역 · 서울·경기</strong>
            <span>
              상담 장소는 담당 상담사와 사전 협의합니다. 고정 상담센터는 없으며,
              예약 전에 장소·일정·총비용을 함께 확인합니다.
            </span>
          </p>
        </div>

        <section className="af-business" aria-labelledby="af-business-title">
          <h2 id="af-business-title">운영 정보</h2>
          <dl className="af-business-details">
            {businessDetails.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="af-business-note">
            사업자 정보는 운영 준비 후 정식 안내됩니다.
          </p>
        </section>

        <div className="af-bottom">
          <nav className="af-policy-links" aria-label="약관 및 계정 메뉴">
            <Link className="af-privacy" to="/privacy">
              개인정보 처리방침
            </Link>
            <Link to="/terms">이용약관</Link>
            {isAdmin && <Link to="/admin">운영 관리</Link>}
            {signedIn && (
              <button type="button" onClick={onLogout}>
                로그아웃 <LogOut size={14} aria-hidden="true" />
              </button>
            )}
          </nav>
          <p className="af-copyright">
            © {new Date().getFullYear()} ARUNIA. All hearts welcome.
          </p>
        </div>
        <p className="af-content-note">
          가상 상담사·후기는 화면 구성 예시이며, 사진은 AI로 제작한 콘셉트
          이미지입니다.
        </p>
      </div>
    </footer>
  );
}
