import { saveConsent } from '../lib/consent';

interface Props {
  onClose: () => void;
  onAgree: () => void;
}

export default function ConsentModal({ onClose, onAgree }: Props) {
  const handleAgree = () => {
    saveConsent();
    onAgree();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <div className="w-full max-w-[420px] rounded-2xl bg-card border border-[var(--line)] p-6 shadow-2xl">
        <div className="mb-4 text-center text-4xl">🔐</div>

        <h2 className="mb-3 text-center text-lg font-bold">
          제3자 정보 제공 동의
        </h2>

        <div className="mb-5 max-h-[280px] overflow-y-auto rounded-xl bg-deep/50 p-4 text-[13px] leading-relaxed text-muted">
          <p className="mb-3 font-semibold text-ink">
            폼 분석 서비스 이용을 위해 아래 내용에 동의해 주세요.
          </p>

          <div className="mb-4">
            <p className="mb-1.5 font-medium text-ink/90">1. 제공받는 자</p>
            <p>Google LLC (Gemini API 서비스 제공자)</p>
          </div>

          <div className="mb-4">
            <p className="mb-1.5 font-medium text-ink/90">2. 제공 목적</p>
            <p>업로드한 다이빙 영상 프레임을 AI가 분석하여 폼 코칭 결과를 생성</p>
          </div>

          <div className="mb-4">
            <p className="mb-1.5 font-medium text-ink/90">3. 제공 항목</p>
            <p>영상에서 추출된 이미지 프레임 (최대 12장, 720px 리사이즈)</p>
          </div>

          <div className="mb-4">
            <p className="mb-1.5 font-medium text-ink/90">4. 보유 및 이용 기간</p>
            <p>분석 완료 즉시 삭제 (서버에 저장하지 않음)</p>
          </div>

          <div>
            <p className="mb-1.5 font-medium text-ink/90">5. 동의 거부 권리</p>
            <p>동의를 거부할 수 있으나, 거부 시 폼 분석 서비스를 이용할 수 없습니다.</p>
          </div>
        </div>

        <button
          onClick={handleAgree}
          className="mb-3 w-full rounded-xl bg-aqua py-3.5 text-[15px] font-bold text-[#04222a] transition-transform hover:-translate-y-px"
        >
          동의하고 계속하기
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-[13px] text-muted hover:text-ink"
        >
          취소
        </button>
      </div>
    </div>
  );
}
