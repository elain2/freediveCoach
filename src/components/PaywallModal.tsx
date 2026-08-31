import { getUsage, unlockToday } from '../lib/usageLimit';

const KAKAOPAY_LINK = 'https://qr.kakaopay.com/FFIzFGTdD';

interface Props {
  onClose: () => void;
  onUnlock: () => void;
}

export default function PaywallModal({ onClose, onUnlock }: Props) {
  const { count, limit } = getUsage();

  const handleUnlock = () => {
    unlockToday();
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <div className="w-full max-w-[380px] rounded-2xl bg-card border border-[var(--line)] p-6 shadow-2xl">
        <div className="mb-4 text-center text-4xl">🐱</div>

        <h2 className="mb-2 text-center text-lg font-bold">
          오늘 무료 분석을 다 썼어요
        </h2>

        <p className="mb-5 text-center text-[14px] text-muted">
          하루 {limit}회 무료 · 오늘 {count}회 사용
        </p>

        <div className="mb-5 rounded-xl bg-deep/50 p-4 text-[14px]">
          <p className="mb-3 text-muted">
            커피 한 잔 가격으로 후원해 주시면 오늘 하루 무제한으로 분석할 수 있어요.
          </p>
          <p className="text-[13px] text-muted/70">
            서버 비용에 보태고 있습니다 :)
          </p>
        </div>

        <a
          href={KAKAOPAY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#fee500] py-3.5 text-[15px] font-bold text-black transition-transform hover:-translate-y-px"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.782 5.04 4.469 6.396-.14.508-.503 1.83-.576 2.114-.091.35.128.345.27.251.11-.073 1.769-1.2 2.49-1.69.436.062.882.096 1.337.096 5.523 0 10-3.463 10-7.167C20 6.463 17.523 3 12 3z"/>
          </svg>
          카카오페이로 후원하기
        </a>

        <button
          onClick={handleUnlock}
          className="mb-2 w-full rounded-xl border border-aqua py-3 text-[14px] font-semibold text-aqua transition-colors hover:bg-aqua/10"
        >
          후원 완료했어요
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-[13px] text-muted hover:text-ink"
        >
          다음에 할게요
        </button>
      </div>
    </div>
  );
}
