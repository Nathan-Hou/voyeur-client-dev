import React from 'react';

import s from "./Modals.module.scss";

const AgreementModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-11/12 max-w-2xl rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 h-[40dvh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const TermsContent = () => (
  <div className="space-y-4 text-gray-700">    
    <section className="mb-6">
      <h4 className="font-bold mb-2">1. 服務條款</h4>
      <p>歡迎使用我們的教育學習平台。使用本平台即表示您同意遵守以下條款。</p>
    </section>

    <section className="mb-6">
      <h4 className="font-bold mb-2">2. 帳號註冊與管理</h4>
      <p>用戶須妥善保管帳號密碼，對帳號下的所有活動負責。</p>
    </section>

    <section className="mb-6">
      <h4 className="font-bold mb-2">3. 平台使用規則</h4>
      <p>3.1 用戶應遵守相關法律法規。</p>
      <p>3.2 禁止上傳、散布違法或不當內容。</p>
    </section>

    <section className="mb-6">
      <h4 className="font-bold mb-2">4. 服務變更與終止</h4>
      <p>4.1 平台保留修改、暫停或終止服務的權利。</p>
      <p>4.2 如用戶違反使用條款，平台可終止其使用權限。</p>
    </section>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-4 text-gray-700">
    <h3 className='text-xl font-bold text-center !mb-6'>試集(iStuPass)<span className='text-red-500 ml-1'>隱私權政策</span></h3>
    <p className='!mb-6'><span className='font-bold'>試集(iStuPass)(以下簡稱本平台)</span>非常重視會員的隱私權且遵循「個人資料保護法」之規定，因此制訂了隱私權保護政策，您可參考下列隱私權保護政策的內容。</p>
    
    <section className="mb-6">
      <h4 className="font-bold mb-2 text-xl text-secondary">個人資料之安全</h4>
      <p>保護會員的個人隱私是本平台重要的經營理念，在未經會員同意之下，我們絕不會將會員的個人資料提供予任何與本網路平台服務無關之第三人。會員應妥善保密自己的網路密碼及個人資料，不要將任何個人資料，尤其是網路密碼提供給任何人。在使用完本平台網站所提供的各項服務功能後，務必記得登出帳戶，若是與他人共享電腦或使用公共電腦，切記要關閉瀏覽器視窗。</p>
    </section>

    <section className="mb-6">
      <h4 className="font-bold mb-2 text-xl text-secondary">個人資料的利用</h4>
      <p>本平台相關網站所取得的個人資料，都僅供本平台於其內部、依照原來所說明的使用目的和範圍，除非事先說明、或依照相關法律規定，否則本平台不會將資料提供給第三人、或移作其他目的使用。利用之目的例示如下：</p>
      <ol className={`${s.list} mt-2`}>
        <li><span>1.</span><p>以會員身份使用本平台提供之各項服務時，於頁面中自動顯示會員資訊。</p></li>
        <li><span>2.</span><p>為遂行交易行為：<span className='block'></span>會員對商品或勞務為預約、下標、購買、參與贈獎等之活動或從事其他交易時，關於商品配送、勞務提供、價金給付、回覆客戶之詢問、本平台對會員之詢問、相關售後服務及其他遂行交易所必要之業務。</p></li>
        <li><span>3.</span><p>宣傳廣告或行銷等：<span className='block'></span>提供會員各種電子雜誌等資訊、透過電子郵件、郵件、電話等提供與服務有關之資訊。 將會員所瀏覽之內容或廣告，依客戶之個人屬性或購買紀錄、本平台網站之瀏覽紀錄等項目，進行個人化作業、會員使用服務之分析、新服務之開發或既有服務之改善等。 針對民調、活動、留言版等之意見，或其他服務關連事項，與會員進行聯繫。</p></li>
        <li><span>4.</span><p>回覆客戶之詢問：<span className='block'></span>針對會員透過電子郵件、郵件、傳真、電話或其他任何直接間接連絡方式向本平台所提出之詢問進行回覆。</p></li>
        <li><span>5.</span>其他業務附隨之事項：附隨於上述 1. 至 4. 之利用目的而為本平台提供服務所必要之使用。</li>
        <li><span>6.</span><p>對於各別服務提供者之資訊提供：<span className='block'></span>會員對服務提供者之商品或勞務為預約、下標、購買、參加贈獎活動或申請其他交易時，本平台於該交易所必要之範圍內，得將會員之個人資料檔案提供予服務提供者，並由服務提供者負責管理該個人資料檔案。本平台將以規約課予服務提供者依保障會員隱私權之原則處理個人資料之義務，但無法保證服務提供者會必然遵守。詳細內容，請向各別服務提供者洽詢。</p></li>
        <li><span>7.</span><p>其他：<span className='block'></span>提供個別服務時，亦可能於上述規定之目的以外，利用個人資料。此時將在該個別服務之網頁載明其要旨。</p></li>
      </ol>
    </section>

    <section className="mb-6">
      <h4 className="font-bold mb-2 text-lg text-secondary">資料安全</h4>
      <p>為保障會員的隱私及安全，本平台會員帳號資料會用密碼保護。本平台並盡力以合理之技術及程序，保障所有個人資料之安全。</p>
    </section>

    <section className="mb-6">
      <h4 className="font-bold mb-2 text-lg text-secondary">個人資料查詢或更正的方式</h4>
      <p>會員對於其個人資料，有查詢及閱覽、製給複製本、補充或更正、停止電腦處理及利用、刪除等需求時，可以與客服中心聯絡，本平台將迅速進行處理。</p>
    </section>

    <section className="mb-6">
      <h4 className="font-bold mb-2 text-lg text-secondary">Cookie</h4>
      <p>為了便利會員使用，本平台網站會使用cookie技術，以便於提供會員所需要的服務；cookie是網站伺服器用來和會員瀏覽器進行溝通的一種技術，它可能在會員的電腦中隨機儲存字串，用以辨識區別使用者，若會員關閉cookie有可能導致無法順利登入網站或無法使用購物車等狀況。</p>
    </section>

    <section className="">
      <h4 className="font-bold mb-2 text-lg text-secondary">隱私權保護政策修訂</h4>
      <p>隨著市場環境的改變本公司將會不時修訂網站政策。會員如果對於本平台網站隱私權聲明、或與個人資料有關之相關事項有任何疑問，可以利用電子郵件和本平台客服中心聯絡。</p>
    </section>

    <div className='w-full h-[1px] bg-gray-400 !my-8'></div>

    <h3 className='text-red-500 text-xl font-bold !mb-6 text-center'>輔昶科技股份有限公司電腦處理個人資料檔案安全維護計劃</h3>
    <section className="mb-6">
      <p>壹、為確保本事業保有個人資料檔之安全，依法指定專人依下述個人資料檔案安全維護計畫辦理維護事項。</p>
    </section>

    <section className="mb-6">
      <p className='mb-3'>貳、個人資料檔案之安全維護計畫：</p>
      <p>一、資料安全方面：</p>
      <p>(一) 個人資料檔案建置在資料庫上者，應釐定使用範圍及使用權限「使用者代碼」、「識別密碼」，識別密碼應保密，不得與他人共用。</p>
      <p>(二) 個人資料檔案儲存在個人電腦硬式磁碟機上者，資料保有單位應在該個人電腦設置開機密碼、螢幕保護程式密碼及相關安全措施。</p>
      <p>(三) 非經允准不得使用個人資料檔案。</p>
      <p>(四) 個人資料檔案使用完畢應即退出，不得留置在電腦顯示畫面上。</p>
      <p>(五) 個人所使用之識別密碼應予保密，且須於一固定時間後自行變更密碼，以防它人竊取並長期使用。</p>
      <p>(六) 若顧客以電話查詢其個人資料時，需先經認證後方可回覆相關資料，以維護顧客之權益。</p>
      <p>(七) 以網際網路蒐集、處理、國際傳遞及利用個人資料時，應採行必要的事前預防及保護措施，偵測及防制電腦病毒及其他惡意軟體，確保系統正常運作。</p>
      <p>(八) 以網際網路進行交易處理時，應評估可能之安全風險，並研擬妥適的安全控管措施。</p>
    </section>

    <section className="mb-6">
      <p>二、資料稽核方面：</p>
      <p>(一) 以電腦處理個人資料時，應核對個人資料之輸入、輸出、編輯或更正是否與原檔案相符。</p>
      <p>(二) 個人資料提供使用時，應核對與檔案資料是否相符，如有疑義，應調閱原檔案查核。</p>
      <p>(三) 應建立定期稽核制度，並保存稽核資料。</p>
    </section>

    <section className="mb-6">
      <p>三、設備管理方面：</p>
      <p>(一) 建置個人資料之有關電腦設備，資料保有單位應定期保養維護。</p>
      <p>(二) 非有必要，不得任意移動電腦設備。</p>
      <p>(三) 建置個人資料之個人電腦，不得直接作為公眾查詢之前端工具。</p>
      <p>(四) 建立異地備援制度。</p>
      <p>(五) 確實刪除廢棄或轉售之相關電腦硬體中所儲存之個人資料。</p>
    </section>

    <section className="">
      <p>四、其他安全維護事項：</p>
      <p>(一) 以電腦處理個人資料檔案之人員，其職務有異動時，應將所保管之儲存媒體及有關資料列冊移交，接辦人員應另行設定密碼，以利管理。</p>
      <p>(二) 員工離職後，其離職員工曾接觸過之密碼均需取消並作適當之調整。</p>
      <p>(三) 遵守一般電腦安全維護之有關規定。</p>
    </section>
  </div>
);

export { AgreementModal, TermsContent, PrivacyContent };