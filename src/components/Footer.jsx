import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto max-w-[960px] px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Логотип и гарантии */}
          <div className="space-y-4">
            <div className="h-10">
              <div className="text-2xl font-bold">TicketWayz</div>
            </div>
            <ul className="space-y-6">
              <li className="flex items-center">
                <svg className="h-3.5 w-4 text-green-600 mr-2" viewBox="0 0 16 14" fill="currentColor">
                  <path d="M6 13.0234L0 7.26475L1.86067 5.35141L5.96467 9.26741L14.1047 0.976746L16 2.85475L6 13.0234Z" fill="currentColor" />
                </svg>
                <p className="text-sm font-bold">Проверка безопасности международного уровня</p>
              </li>
              <li className="flex items-center">
                <svg className="h-3.5 w-4 text-green-600 mr-2" viewBox="0 0 16 14" fill="currentColor">
                  <path d="M6 13.0234L0 7.26475L1.86067 5.35141L5.96467 9.26741L14.1047 0.976746L16 2.85475L6 13.0234Z" fill="currentColor" />
                </svg>
                <p className="text-sm font-bold">Прозначное ценообразование</p>
              </li>
              <li className="flex items-center">
                <svg className="h-3.5 w-4 text-green-600 mr-2" viewBox="0 0 16 14" fill="currentColor">
                  <path d="M6 13.0234L0 7.26475L1.86067 5.35141L5.96467 9.26741L14.1047 0.976746L16 2.85475L6 13.0234Z" fill="currentColor" />
                </svg>
                <p className="text-sm font-bold">Гарантия заказа — 100%</p>
              </li>
              <li className="flex items-center">
                <svg className="h-3.5 w-4 text-green-600 mr-2" viewBox="0 0 16 14" fill="currentColor">
                  <path d="M6 13.0234L0 7.26475L1.86067 5.35141L5.96467 9.26741L14.1047 0.976746L16 2.85475L6 13.0234Z" fill="currentColor" />
                </svg>
                <p className="text-sm font-bold">Служба поддержки клиентов от А до Я</p>
              </li>
            </ul>
          </div>

          {/* Наша компания */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">Наша компания</h3>
            <ul className="space-y-5">
              <li><a href="#" className="hover:underline">О нас</a></li>
              <li><a href="#" className="hover:underline">Наши партнеры</a></li>
              <li><a href="#" className="hover:underline">Партнерская программа</a></li>
              <li><a href="#" className="hover:underline">Вакансии</a></li>
              <li><a href="#" className="hover:underline">Организаторам мероприятий</a></li>
            </ul>
          </div>

          {/* Есть вопросы? */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">Есть вопросы?</h3>
            <ul className="space-y-5">
              <li><a href="#" className="hover:underline">Центр помощи / Свяжитесь с нами</a></li>
              <li><a href="#" className="hover:underline">Гарантия Низкой Цены</a></li>
            </ul>
          </div>

          {/* Выбор страны/валюты */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4">Мероприятия по всему миру</h3>
            <button className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 mb-5 flex items-center">
              <span className="w-6 h-3.5 mx-2 bg-[url('https://img.vggcdn.net/img/sh/sh_flags.webp')] bg-no-repeat bg-[position:-126px_-160.875px] bg-[size:288px_186.75px]"></span>
              <span>США</span>
            </button>
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="border-b border-zinc-200 dark:border-zinc-700 m-3 p-3">
                <div className="flex items-center">
                  <svg className="h-4 w-5 mr-3" viewBox="0 0 19 17" fill="currentColor">
                    <path d="M11.0869885,2.7667286 L11.1610498,3.93936529 C9.65513739,4.0257701 7.81594931,4.08748782 5.63114198,4.12451846 C5.59411135,4.50716833 5.56942426,4.8898182 5.54473717,5.28481161 C6.06316603,5.18606326 6.60628197,5.13668908 7.18642855,5.13668908 C7.33455108,5.13668908 7.49501716,5.13668908 7.64313969,5.14903263 C7.70485741,4.93919237 7.76657513,4.72935212 7.81594931,4.50716833 L9.03796018,4.79106984 C8.988586,4.98856655 8.92686828,5.18606326 8.87749411,5.38355996 C9.29717461,5.50699541 9.67982448,5.69214857 10.0501308,5.93901945 C10.9635531,6.55619666 11.4326078,7.39555767 11.4326078,8.46944601 C11.4326078,9.60505208 11.0376143,10.4691002 10.2476275,11.0862774 C9.5193584,11.6417369 8.42078297,12.0243867 6.93955767,12.2218834 L6.49519008,11.1109645 C7.69251386,10.9628419 8.58124905,10.691284 9.17373917,10.3086341 C9.81560346,9.86426651 10.1488792,9.25943284 10.1488792,8.46944601 C10.1488792,7.74117691 9.80325992,7.18571742 9.11202145,6.790724 C8.91452474,6.6796321 8.71702803,6.5932273 8.51953132,6.53150957 C8.149225,7.58071083 7.70485741,8.48178956 7.21111564,9.2470893 C6.10019666,10.8764371 4.7424068,11.7034546 3.12540251,11.7034546 C2.49588176,11.7034546 1.98979645,11.4936143 1.60714658,11.0986209 C1.21215316,10.691284 1.027,10.148168 1.027,9.48161664 C1.027,8.32132348 1.60714658,7.30915286 2.77978328,6.45744831 C3.22415087,6.12417262 3.71789263,5.85261464 4.24866503,5.65511794 C4.26100858,5.14903263 4.29803921,4.64294731 4.34741339,4.14920555 C3.35992985,4.14920555 2.32307214,4.16154909 1.23684025,4.16154909 L1.22449671,2.97656885 C2.38478986,2.97656885 3.47102175,2.9642253 4.48319237,2.9642253 C4.54491009,2.47048354 4.6313149,1.97674177 4.73006326,1.483 L5.98910477,1.75455797 C5.90269996,2.14955139 5.82863869,2.5445448 5.77926451,2.93953821 C7.9270412,2.90250758 9.70451157,2.84078986 11.0869885,2.7667286 Z M7.27283336,6.32166932 L7.18642855,6.32166932 C6.59393843,6.32166932 6.03847894,6.38338704 5.52005009,6.50682249 C5.52005009,7.45727539 5.56942426,8.34601057 5.6928597,9.16068449 C5.82863869,8.98787487 5.96441768,8.80272171 6.11254021,8.605225 C6.5569078,7.93867361 6.95190121,7.18571742 7.27283336,6.32166932 Z M4.23632149,6.98822071 C4.03882478,7.08696906 3.85367162,7.19806096 3.680862,7.3214964 C2.75509619,7.9633607 2.29838505,8.67928626 2.29838505,9.48161664 C2.29838505,10.1728551 2.56994302,10.5308179 3.12540251,10.5308179 C3.61914428,10.5308179 4.1005425,10.3950389 4.56959718,10.1358245 C4.37210048,9.17302803 4.26100858,8.12382678 4.23632149,6.98822071 Z" fill="currentColor"></path>
                    <path d="M13.642295,8 L15.4102704,8 L19.0658585,17.491236 L17.2845901,17.491236 L16.3939559,14.97885 L12.6054373,14.97885 L11.7148031,17.491236 L10,17.491236 L13.642295,8 Z M13.0574009,13.7160105 L15.9552853,13.7160105 L14.5329292,9.63504485 L14.4930501,9.63504485 L13.0574009,13.7160105 Z" fill="currentColor"></path>
                  </svg>
                  <span className="ml-3">Русский</span>
                </div>
              </div>
              <div className="p-3 m-3">
                <span className="inline-block ml-[-8px] w-[34px] text-center">CHF</span> Швейцарский франк
              </div>
            </div>
          </div>
        </div>

        <hr className="my-2 border-t border-zinc-200 dark:border-zinc-800" />

        <div className="pt-8 pb-12 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <div className="flex flex-col lg:flex-row justify-between">
            <div>
              <span>Авторские права © viagogo Entertainment Inc 2025</span>&nbsp;<a href="#" className="text-blue-400 hover:underline">Сведения о компании</a>
              <br />
              <span>
                Использование данного веб-сайта означает принятие&nbsp;<a href="#" className="text-blue-400 hover:underline">Условий и положений</a>, а также&nbsp;<a href="#" className="text-blue-400 hover:underline">Политики конфиденциальности</a>,&nbsp;<a href="#" className="text-blue-400 hover:underline">Политики в отношении файлов cookie</a>, и&nbsp;<a href="#" className="text-blue-400 hover:underline">Политики конфиденциальности для мобильных устройств</a>
              </span>
              <button className="text-blue-400 rounded-xl inline-flex items-center justify-center gap-1">
                &nbsp;Do Not Share My Personal Information/Your Privacy Choices
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;