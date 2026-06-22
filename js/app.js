/* 수락스트릿 앱 로직 — index.html 인라인 <script>에서 구조분리. 동작 동일. */
'use strict';
var SURAK_IMG='surak/default.png';
function surakFace(e){return 'surak/'+(e||'default')+'.png';}
var GOODS_KEYS=['keyring','tumbler','sock','bandana','cap'];
var lang='KO';
var _map=null,_iw=null,_markers=[],_curFilter='all',_mapReady=false;
var _currentMode='walk',_currentPlayUrl=null,_userOverride=false;
var _scWidget=null,_scReady=false,_scPlaying=false,_pendingUrl=null;
var _curTrackTitle='',_curTrackDur=0,_curTrackPos=0,_progTimer=null;
var _gpsWatcher=null,_lastZone=null,_gpsActive=false;
var _homeWeatherLoaded=false;

var WD_MAP={
  KO:{0:'맑음',1:'대체로 맑음',2:'구름 조금',3:'흐림',45:'안개',51:'이슬비',61:'비',71:'눈',80:'소나기',95:'뇌우'},
  EN:{0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Thunderstorm'},
  JP:{0:'晴れ',1:'概ね晴れ',2:'部分的に曇り',3:'曇り',45:'霧',51:'小雨',61:'雨',71:'雪',80:'にわか雨',95:'雷雨'},
  CN:{0:'晴天',1:'大体晴',2:'多云',3:'阴天',45:'雾',51:'毛毛雨',61:'雨',71:'雪',80:'阵雨',95:'雷暴'}
};
var WI={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',61:'🌧️',71:'🌨️',80:'🌦️',95:'⛈️'};

WD_MAP={
  KO:{0:'맑음',1:'대체로 맑음',2:'구름 조금',3:'흐림',45:'안개',51:'이슬비',61:'비',71:'눈',80:'소나기',95:'뇌우'},
  EN:{0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Thunderstorm'},
  JP:{0:'晴れ',1:'概ね晴れ',2:'部分的に曇り',3:'曇り',45:'霧',51:'小雨',61:'雨',71:'雪',80:'にわか雨',95:'雷雨'},
  CN:{0:'晴天',1:'大体晴',2:'多云',3:'阴天',45:'雾',51:'毛毛雨',61:'雨',71:'雪',80:'阵雨',95:'雷暴'}
};
var CHEON_POEMS=[
  {ko:'이 세상 소풍 끝내는 날, 가서, 아름다웠더라고 말하리라.',en:'When this world picnic ends, I will go and say, how beautiful it was.',jp:'この世の遠足が終わる日、行って、美しかったと言おう。',cn:'当这世界的郊游结束那天，我要去说，曾经多么美丽。',src:'귀천(歸天)',navHome:'首页',navMy:'我的',homeModeTitle:'今日模式',homeHotTitle:'🔥 热门地点',homeSurakMsg:'今天也来水落街！🐿️',homeSurakSub:'水落山 · 设计街',homeCourseName:'水落山顶峰路线',modeWalk:'散步',modeWalkDs:'街道感',modeActive:'登山',modeActiveDs:'能量UP！',modeRelax:'休闲',modeRelaxDs:'咖啡 & 美食',goodsAllDone:'🏆 全部完成！大使达成！',goodsKeep:'继续收集！',goodsHowTitle:'收集方法',ambTitle:'水落街大使',ambDesc:'完成水落设计街所有主题的大使认证。',ambViewCert:'查看证书 📜',ambProgress:'进行中 🎒',loginTitle:'快捷登录',loginDesc:'登录后收藏跨设备保存。',loginKakao:'💛 Kakao登录',loginNaver:'🟢 Naver登录',loginGoogle:'🔵 Google登录',myMenuCollection:'收藏状况',myMenuInfo:'水落山导览',myMenuMusic:'音乐设置',myMenuHistory:'访问记录',myMenuNotice:'公告',myMenuSettings:'设置',loginRequired:'访问记录（登录后）',gpsDetecting:'GPS检测中...',gpsOn:'GPS 开',gpsOff:'GPS 关',gpsTest:'测试',soundWith:'与水落一起听House',soundPlaylists:'📋 播放列表',soundPlaying:'▶ 播放中',nowPlaying:'NOW PLAYING',infoSurakMt:'水落山(水樂山)',infoMtDesc:'有水的欢乐之山 · 海拔638m',infoHikingTitle:'🥾 登山路线',infoWaterTitle:'💧 水系名胜',infoLandmarkTitle:'✨ 水落街名胜',infoRunwayTitle:'✨ 光之跑道',infoRunwayDesc:'装点整条水落设计街的四季主题灯光演出。每晚20:00~20:30，30分钟光之盛宴。',infoRunwayTime:'每日运营',infoCheonTitle:'🖊️ 诗人千尚炳足迹',infoAccessTitle:'📍 交通',infoSubway:'4号线水落山站3号出口 → 步行1分钟',infoBus:'在水落山站公交站下车',infoCar:'首尔芦原区同一路242街',popMenu:'菜单',popInfo:'店铺信息',popGoods:'周边优惠',popHours:'营业时间',popVisit:'到店认证',popCollect:'收集周边',popCollected:'✅ 已收集'},
  {ko:'나 하늘로 돌아가리라, 새벽빛 와 닿으면 스러지는 이슬 더불어...',en:'I will return to the sky, like the dew that vanishes at dawn light...',jp:'私は天に帰ろう、夜明けの光に触れて消える露とともに...',cn:'我要回归天空，随着黎明曙光触碰而消散的露珠一起...',src:'귀천(歸天)'},
  {ko:'소풍은 끝났어도 아름다운 것들은 남아 이 거리를 빛낸다.',en:'Though the picnic ended, beautiful things remain and light up this street.',jp:'遠足は終わっても、美しいものは残ってこの通りを照らす。',cn:'郊游虽已结束，美丽的事物留下来，照亮这条街道。',src:'수락디자인거리 헌정'},
  {ko:'가난이야 한낱 남루이지만, 내 가슴 속엔 영원한 시가 있다.',en:'Poverty is but a tattered cloak, yet in my heart lives eternal poetry.',jp:'貧しさは単なるぼろ切れだが、私の胸には永遠の詩がある。',cn:'贫困不过是一件破旧的外衣，但我胸中有永恒的诗。',src:'가난한 사랑 노래'},
  {ko:'새는 하늘을 날고, 나는 길을 걷는다. 그리고 우리는 모두 집으로 돌아간다.',en:'Birds fly the sky, I walk the road. And we all go home.',jp:'鳥は空を飛び、私は道を歩く。そして私たちはみな家に帰る。',cn:'鸟儿在天空飞翔，我在路上行走。我们都回到了家。',src:'새'}
];
var CHEON_PLACES=[
  {id:'cp1',icon:'📜',KO:{name:'천상병 시비(詩碑)',addr:'수락산역 3번출구 앞',desc:'시인 천상병의 대표작 귀천(歸天) 시비. 수락산 여행의 시작점.'},EN:{name:'Cheon Sang-byeong Poetry Stone',addr:'Near Exit 3, Suraksan Stn.',desc:'Stone monument of poet Cheon masterpiece. Starting point of the Surak journey.'},JP:{name:'千尚炳詩碑',addr:'水落山駅3番出口前',desc:'詩人千尚炳の代表作帰天の詩碑。スラク旅のスタート地点。'},CN:{name:'千尚炳诗碑',addr:'水落山站3号出口前',desc:'诗人千尚炳代表作归天诗碑。水落旅程的起点。'}},
  {id:'cp2',icon:'☕',KO:{name:'카페 귀천(歸天)',addr:'수락디자인거리 내',desc:'시인의 이름을 딴 감성 카페. 시집과 함께하는 커피 한 잔.'},EN:{name:'Café Gwicheon',addr:'Surak Design Street',desc:'A café named after the poet work. Coffee with poetry books.'},JP:{name:'カフェ帰天',addr:'スラクデザイン通り内',desc:'詩人の作品にちなんだ感性カフェ。詩集とともに一杯のコーヒー。'},CN:{name:'归天咖啡厅',addr:'水落设计街内',desc:'以诗人作品命名的格调咖啡厅。一杯咖啡配诗集。'}},
  {id:'cp3',icon:'🎨',KO:{name:'천상병 벽화거리',addr:'동일로242길 일대',desc:'시인의 시구절이 새겨진 벽화들. 수락거리의 문화적 자산.'},EN:{name:'Poetry Mural Street',addr:'Dongil-ro 242-gil',desc:'Murals inscribed with the poet verses. A cultural asset of Surak Street.'},JP:{name:'千尚炳壁画通り',addr:'同一路242キル一帯',desc:'詩人の詩句が刻まれた壁画。スラク通りの文化的資産。'},CN:{name:'千尚炳壁画街',addr:'同一路242街一带',desc:'刻有诗人诗句的壁画，水落街的文化资产。'}}
];
var WATER_SPOTS=[
  {id:'ws1',icon:'💧',color:'#2A8AAA',KO:{name:'벽운계곡',desc:'수락산 대표 계곡. 여름 피서지로 유명하며 맑고 시원한 물줄기가 일품입니다.',route:'3번출구 → 도보 20분'},EN:{name:'Byeogun Valley',desc:'Suraksan signature valley. Famous summer retreat with crystal-clear streams.',route:'Exit 3 → 20 min walk'},JP:{name:'碧雲渓谷',desc:'水落山を代表する渓谷。夏の避暑地として有名。',route:'3番出口 → 徒歩20分'},CN:{name:'碧云溪谷',desc:'水落山代表溪谷。著名夏季避暑胜地。',route:'3号出口 → 步行20分'}},
  {id:'ws2',icon:'🌊',color:'#1a6a8a',KO:{name:'처마바위 폭포',desc:'병풍바위 아래 숨겨진 소형 폭포. 등산 중 만나는 청량한 쉼터입니다.',route:'3번출구 → 도보 40분'},EN:{name:'Cheomabawi Falls',desc:'A hidden waterfall beneath Byeongpungbawi Rock. A refreshing rest spot mid-hike.',route:'Exit 3 → 40 min walk'},JP:{name:'軒岩滝',desc:'屏風岩の下に隠れた小さな滝。登山中に出会う清々しい休憩スポット。',route:'3番出口 → 徒歩40分'},CN:{name:'屋檐岩瀑布',desc:'屏风岩下隐藏的小瀑布。登山途中邂逅的清凉休憩处。',route:'3号出口 → 步行40分'}},
  {id:'ws3',icon:'🏊',color:'#1565a0',KO:{name:'은류폭포',desc:'수락산 최고의 폭포. 높이 15m의 웅장한 폭포로 사진 명소입니다.',route:'3번출구 → 도보 60분'},EN:{name:'Eunryu Falls',desc:'Suraksan finest waterfall. A majestic 15m cascade and top photo spot.',route:'Exit 3 → 60 min walk'},JP:{name:'銀流瀑布',desc:'水落山最高の滝。高さ15mの雄大な滝で写真スポット。',route:'3番出口 → 徒歩60분'},CN:{name:'银流瀑布',desc:'水落山最佳瀑布。高达15m的壮观瀑布。',route:'3号出口 → 步行60分'}}
];
var GPS_ZONES=[
  {id:'zone1',mode:'walk',
   lat:37.675915,lng:127.055491,radius:200,
   label:{KO:'🚶 Walk 구역 — 거리 산책',EN:'🚶 Walk Zone — Street Stroll',JP:'🚶 Walk ゾーン — 街歩き',CN:'🚶 Walk 区域 — 街道漫步'}},
  {id:'zone2',mode:'active',
   lat:37.675257,lng:127.057021,radius:200,
   label:{KO:'⚡ Active 구역 — 에너지 등반',EN:'⚡ Active Zone — Energy Climb',JP:'⚡ Active ゾーン — エネルギー登山',CN:'⚡ Active 区域 — 能量攀登'}},
  {id:'zone3',mode:'relax',
   lat:37.674512,lng:127.058807,radius:200,
   label:{KO:'☕ Relax 구역 — 쉼터 감성',EN:'☕ Relax Zone — Resting Vibes',JP:'☕ Relax ゾーン — 休憩の感性',CN:'☕ Relax 区域 — 休憩感性'}}
];
var CERT_POINTS=CERT_POINTS=[
  {id:"cp1",ko:"수락산 정상 (638m)",en:"Suraksan Summit (638m)",jp:"スラクサン山頂(638m)",cn:"水落山山顶(638m)",dko:"수락산 최고봉. 서울 북부 파노라마 뷰. 정상석 앞 인증샷!",den:"Suraksan's highest peak. Panoramic view.",djp:"スラクサン最高峰。パノラマビュー。",dcn:"水落山最高峰。首尔北部全景。",goods:"cap",color:"#E85030",icon:"⛰️",mx:146,my:-95,lat:37.6665,lng:127.0685},
  {id:"cp2",ko:"은류폭포 (둘레길 중간)",en:"Eunryu Falls (Dulle-gil Mid)",jp:"銀流滝（コース中間）",cn:"银流瀑布（路线中间）",dko:"수락산 둘레길 중간 은류폭포. 시원한 폭포 앞 인증샷!",den:"Eunryu Falls on Dulle-gil. Cool waterfall photo!",djp:"コース中間の銀流滝。涼しい滝の前！",dcn:"路线中间的银流瀑布。清凉瀑布认证！",goods:"bandana",color:"#2A8AAA",icon:"💧",mx:180,my:-24,lat:37.662,lng:127.071},
  {id:"cp3",ko:"향로봉 능선",en:"Hyangnobong Ridge",jp:"香炉峰稜線",cn:"香炉峰山脊",dko:"수락산 주능선 향로봉. 능선 위 절경.",den:"Main ridge of Suraksan. Stunning views.",djp:"主稜線の香炉峰。絶景。",dcn:"水落山主山脊香炉峰。绝美风景。",goods:"sock",color:"#5A7A3A",icon:"🌄",mx:125,my:-55,lat:37.664,lng:127.067},
  {id:"cp4",ko:"3번출구 등산로 입구",en:"Trail Entrance (Exit 3)",jp:"3番出口登山口",cn:"3号出口登山道入口",dko:"수락산역 3번출구 앞 등산로 입구. 수락디자인거리 시작점과 동일!",den:"Trail entrance at Exit 3. Same start as Design Street!",djp:"3番出口すぐ前の登山道入口。",dcn:"正对3号出口的登山道入口。与设计街起点相同！",goods:"tumbler",color:"#3D6B4F",icon:"🥾",mx:12,my:42,lat:37.65785,lng:127.06008},
  {id:"cp5",ko:"내원암 전망대",en:"Naewon Temple Viewpoint",jp:"内院庵展望台",cn:"内院庵观景台",dko:"내원암 위 전망대. 노원구 전경 한눈에.",den:"Observation deck above Naewon Temple. Full Nowon view.",djp:"内院庵上の展望台。蘆原区全景。",dcn:"内院庵上方观景台。一览蘆原区。",goods:"keyring",color:"#8A6A3A",icon:"🏯",mx:194,my:-71,lat:37.665,lng:127.072}
];

var SC_PLAYLISTS={
  walk:{
    label:{KO:'🚶 Walk',EN:'🚶 Walk',JP:'🚶 Walk',CN:'🚶 Walk'},
    desc:{KO:'Jackin House — 거리 산책의 경쾌한 리듬',EN:'Jackin House — Light grooves for street strolling',JP:'Jackin House — 街歩きの軽快なリズム',CN:'Jackin House — 街道漫步的轻快节奏'},
    color:'#3D6B2A',
    default:'https://soundcloud.com/djyinthehouse/sets/vibes-of-life',
    lists:[
      {url:'https://soundcloud.com/djyinthehouse/sets/vibes-of-life',title:'VIBES OF LIFE',sub:'Jackin House · 5 tracks',icon:'🎵'},
      {url:'https://soundcloud.com/djyinthehouse/sets/deal-of-destiny-jackin-house',title:'DEAL OF DESTINY',sub:'Jackin House · 5 tracks',icon:'🎵'}
    ]
  },
  active:{
    label:{KO:'⚡ Active',EN:'⚡ Active',JP:'⚡ Active',CN:'⚡ Active'},
    desc:{KO:'Chicago House — 에너지를 끌어올리는 강렬한 비트',EN:'Chicago House — Intense beats for energetic climbing',JP:'Chicago House — エネルギーを高める力強いビート',CN:'Chicago House — 激发能量的强劲节拍'},
    color:'#8B2A2A',
    default:'https://soundcloud.com/djyinthehouse/sets/concrete-grit',
    lists:[
      {url:'https://soundcloud.com/djyinthehouse/sets/concrete-grit',title:'CONCRETE GRIT',sub:'Chicago House · 5 tracks',icon:'⚡'},
      {url:'https://soundcloud.com/djyinthehouse/sets/jekyll-hyde-swing-house',title:'JEKYLL & HYDE',sub:'Swing House · 5 tracks',icon:'🎸'}
    ]
  },
  relax:{
    label:{KO:'☕ Relax',EN:'☕ Relax',JP:'☕ Relax',CN:'☕ Relax'},
    desc:{KO:'Afro & Swing House — 쉼터에서 즐기는 감성 하우스',EN:'Afro & Swing House — Soulful vibes for rest spots',JP:'Afro & Swing House — 休憩スポットの感性ハウス',CN:'Afro & Swing House — 休憩处的感性House'},
    color:'#6B4A1E',
    default:'https://soundcloud.com/djyinthehouse/sets/tales-from-the-past',
    lists:[
      {url:'https://soundcloud.com/djyinthehouse/sets/tales-from-the-past',title:'TALES FROM THE PAST',sub:'Afro Jungle House · 5 tracks',icon:'🌿'},
      {url:'https://soundcloud.com/djyinthehouse/sets/deal-of-destiny-jackin-house',title:'DEAL OF DESTINY',sub:'Jackin House · 5 tracks',icon:'🎵'}
    ]
  }
};
var TRAILS=[
  {id:'jubong',
   ko:'수락산 주봉 코스',en:'Suraksan Summit Course',jp:'水落山主峰コース',cn:'水落山主峰路线',
   lk:'중급',le:'Intermediate',lj:'中級',lc:'中级',
   dist:'8.2km',
   timeko:'약 4시간 (등산 2h+하산 2h)',timeen:'~4hrs (up 2h+down 2h)',timejp:'約4時間（登り2h+下り2h）',timecn:'约4小时（上山2h+下山2h）',
   color:'#2C4A1E',
   ptko:'수락산역 → 벽운지맥 → 물개바위 → 깔딱고개 → 독수리바위 → 철모바위 → 주봉(637m)',
   pten:'Suraksan Stn → Byeokun Ridge → Mulgae Rock → Steep Pass → Eagle Rock → Helmet Rock → Summit(637m)',
   ptjp:'スラクサン駅 → 碧雲지맥 → 물개岩 → 깔딱고개 → 독수리岩 → 철모岩 → 頂上(637m)',
   ptcn:'水落山站 → 碧云山脊 → 海狗岩 → 陡峭坡 → 鹰岩 → 头盔岩 → 主峰(637m)',
   certko:'주봉 정상석 인증샷 → 캡 🧢',certen:'Summit stone photo → Cap 🧢',certjp:'頂上石認証 → キャップ🧢',certcn:'顶峰石认证 → 帽子🧢',
   descend:'하산 후 수락 스트릿 포차거리 추천!',
   landmarks:[
     {name:{KO:'수락산역 3번 출구',EN:'Station Exit 3',JP:'駅3番出口',CN:'车站3号出口'},time:0,elev:50,
      desc:{KO:'등산 시작점. 인근 편의점·김밥 가게에서 식수·도시락 준비',EN:'Start point. Grab water and food at nearby stores.',JP:'登山開始点。近くのコンビニで水・食料を準備。',CN:'登山起点，附近便利店补充饮水和食物。'},
      icon:'🚉',warn:null},
     {name:{KO:'벽운지맥 입구',EN:'Byeokun Ridge Entry',JP:'碧雲지맥入口',CN:'碧云山脊入口'},time:15,elev:120,
      desc:{KO:'산책로 끝, 본격 산길 시작. 마지막 화장실 위치',EN:'End of walking path, mountain trail begins. Last restroom here.',JP:'遊歩道の終わり、本格的な山道の始まり。最後のトイレ。',CN:'步道结束，正式山路开始。最后一处厕所。'},
      icon:'🌲',warn:null},
     {name:{KO:'물개바위',EN:'Mulgae Rock',JP:'물개岩',CN:'海狗岩'},time:40,elev:280,
      desc:{KO:'1차 휴식 스팟. 물개 형상의 바위. 완만한 경사 구간 마지막',EN:'First rest spot. Seal-shaped rock. Last gentle slope section.',JP:'最初の休憩スポット。アザラシ形の岩。緩やかな傾斜の最後。',CN:'第一休息点，海狗形状岩石，平缓坡道最后段。'},
      icon:'🪨',warn:null},
     {name:{KO:'깔딱고개',EN:'Steep Pass',JP:'急坂峠',CN:'陡峭坡口'},time:70,elev:450,
      desc:{KO:'코스 최난구간. 급경사 돌계단과 로프 구간. 충분한 휴식 후 진행',EN:'Hardest section. Steep stone steps and rope sections. Rest well before.',JP:'コース最難関。急な石段とロープ区間。十分な休息後に進む。',CN:'全程最难段，陡峭石阶和绳索路段，充分休息后继续。'},
      icon:'⚠️',warn:{KO:'⚠️ 낙석 주의! 앞사람과 간격 유지',EN:'⚠️ Watch for falling rocks! Keep distance.',JP:'⚠️ 落石注意！前の人との間隔を保つ。',CN:'⚠️ 注意落石！保持与前方人员的距离。'}},
     {name:{KO:'독수리바위',EN:'Eagle Rock',JP:'독수리岩',CN:'鹰岩'},time:90,elev:540,
      desc:{KO:'조망 명소. 서울·의정부 시내 전경 확인 가능. 사진 스팟',EN:'Scenic viewpoint. Seoul and Uijeongbu panorama. Great photo spot.',JP:'眺望名所。ソウル・議政府市内の全景が見える。写真スポット。',CN:'观景名所，可俯瞰首尔和议政府市区全景，绝佳拍照地。'},
      icon:'🦅',warn:null},
     {name:{KO:'철모바위',EN:'Helmet Rock',JP:'鉄帽岩',CN:'头盔岩'},time:100,elev:600,
      desc:{KO:'정상 직전 갈림길. 군용 철모를 닮은 바위. 정상까지 10분',EN:'Junction just before summit. Helmet-shaped rock. 10min to summit.',JP:'頂上直前の分岐点。軍用ヘルメットに似た岩。頂上まで10分。',CN:'顶峰前的岔路口，形似军用头盔的岩石，距顶峰10分钟。'},
      icon:'⛑️',warn:null},
     {name:{KO:'수락산 주봉 (637m)',EN:'Summit (637m)',JP:'水落山主峰 (637m)',CN:'主峰 (637m)'},time:110,elev:637,
      desc:{KO:'정상석 및 태극기. 360도 파노라마 전망. 인증샷 필수!',EN:'Summit stone and Korean flag. 360° panoramic view. Get your photo!',JP:'頂上石と太極旗。360度パノラマ。認証写真を忘れずに！',CN:'顶峰石和太极旗，360度全景视野，必须拍认证照！'},
      icon:'🏔️',warn:null}
   ]
  },
  {id:'valley',
   ko:'벽운계곡 코스',en:'Byeokun Valley Route',jp:'碧雲渓谷コース',cn:'碧云溪谷路线',
   lk:'초중급',le:'Beginner+',lj:'初中級',lc:'初中级',
   dist:'3.5km',timeko:'2시간',timeen:'2hrs',timejp:'2時間',timecn:'2小时',
   color:'#2A558B',
   ptko:'수락산역 → 벽운계곡 → 은류폭포 → 주봉',
   pten:'Suraksan Stn → Byeokun Valley → Eunryu Falls → Summit',
   ptjp:'스라쿠산역 → 碧雲渓谷 → 銀流瀑布 → 頂上',ptcn:'水落山站 → 碧云溪谷 → 银流瀑布 → 顶峰',
   certko:'은류폭포 인증샷 → 텀블러 🥤',certen:'Falls photo → Tumbler 🥤',certjp:'瀑布認証 → タンブラー🥤',certcn:'瀑布认证 → 杯子🥤',
   descend:'하산 후 계곡 근처 카페 추천!'
  },
  {id:'dulle',
   ko:'둘레길 코스',en:'Dulle Trail',jp:'둘레길コース',cn:'环山路线',
   lk:'초급',le:'Easy',lj:'初級',lc:'初级',
   dist:'6.1km',timeko:'2시간',timeen:'2hrs',timejp:'2時間',timecn:'2小时',
   color:'#8B6B2A',
   ptko:'수락산역 → 수락산 둘레길 → 순환',
   pten:'Suraksan Stn → Dulle Trail → Loop',
   ptjp:'スラクサン駅 → 둘레길 → 周回',ptcn:'水落山站 → 环山路 → 循环',
   certko:'둘레길 완주 인증 → 양말 🧦',certen:'Trail completion → Socks 🧦',certjp:'完走認証 → ソックス🧦',certcn:'完成认证 → 袜子🧦',
   descend:'완주 후 수락 스트릿 맛집 투어 추천!'
  }
];
var CAT_GOODS={food:'keyring',cafe:'tumbler',gogi:'sock',bar:'bandana',outdoor:'cap'};
var STORE_IMGS={
  food:["https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&h=200&fit=crop"],
  gogi:["https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=200&fit=crop"],
  cafe:["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop"],
  bar:["https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1570598912132-0ba1dc952b7d?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=300&h=200&fit=crop"],
  outdoor:["https://images.unsplash.com/photo-1551632811-561732d1e306?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=200&fit=crop","https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=300&h=200&fit=crop"],
};

/* ═══ 음악 히든 트랙 (레벨 전용) ═══ */
var HIDDEN_TRACKS = [
  {
    url:'https://soundcloud.com/djyinthehouse/sets/jekyll-hyde-swing-house',
    title:'JEKYLL & HYDE',
    sub:'Swing House · Hidden Track',
    icon:'🔒',
    minLv:3,
    desc:{KO:'숙련가 이상만 해금되는 스윙 하우스 히든 트랙',EN:'Swing house hidden track for Expert+',JP:'熟練者以上のみ解放されるスウィングハウス',CN:'熟练者以上解锁的摇摆House隐藏曲目'},
    hint:{KO:'레벨 3 숙련가 달성 시 해금',EN:'Unlocked at Level 3 Expert',JP:'レベル3熟練者達成で解放',CN:'达到3级熟练者时解锁'}
  },
  {
    url:'https://soundcloud.com/djyinthehouse/sets/deal-of-destiny-jackin-house',
    title:'DEAL OF DESTINY',
    sub:'Jackin House · Hidden Track',
    icon:'🔒',
    minLv:4,
    desc:{KO:'산신령 이상만 해금되는 재킨 하우스 비밀 트랙',EN:'Jackin house secret track for Mountain Spirit+',JP:'山神以上のみのジャッキンハウス秘密トラック',CN:'山神以上解锁的Jackin House秘密曲目'},
    hint:{KO:'레벨 4 산신령 달성 시 해금',EN:'Unlocked at Level 4 Mountain Spirit',JP:'レベル4山の神達成で解放',CN:'达到4级山神时解锁'}
  }
];
function g(id){return document.getElementById(id);}
function se(id,v){var e=g(id);if(e)e.textContent=v;}
function T(k){var t=LANGS[lang]||LANGS.KO;return t[k]||LANGS.KO[k]||k;}

/* ═══ 굿즈 ═══ */
function getGS(){try{return JSON.parse(localStorage.getItem('surak_goods')||'{}');}catch(e){return {};}}
function setGS(s){try{localStorage.setItem('surak_goods',JSON.stringify(s));}catch(e){}}
function toggleGoods(k){var s=getGS();s[k]=!s[k];setGS(s);return s[k];}
function hasGoods(k){return !!getGS()[k];}

/* ═══ 날씨 ═══ */
function fetchWeather(cb){
  fetch('https://api.open-meteo.com/v1/forecast?latitude=37.658&longitude=127.063&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=Asia%2FSeoul')
  .then(function(r){return r.json();}).then(function(d){
    var c=d.current;
    cb({temp:Math.round(c.temperature_2m),code:c.weathercode,wind:Math.round(c.windspeed_10m),hum:c.relativehumidity_2m});
  }).catch(function(){cb(null);});
}
function weatherIcon(c){if(c===0)return'☀️';if(c<=2)return'⛅';if(c<=3)return'☁️';if(c<=48)return'🌫️';if(c<=67)return'🌧️';if(c<=77)return'❄️';if(c<=82)return'🌦️';return'⛈️';}
function weatherDesc(c){var W=WD_MAP[lang]||WD_MAP.KO;if(c===0)return W[0];if(c<=2)return W[1];if(c<=3)return W[2];if(c<=48)return W[45];if(c<=67)return W[61];if(c<=77)return W[71];if(c<=82)return W[80];return W[95];}
function hikingOk(c,t){return c<=3&&t>0&&t<33;}

/* ═══ SC Widget ═══ */
function initScWidget(){
  var iframe=g('sc-widget');if(!iframe||typeof SC==='undefined')return;
  try{
    _scWidget=SC.Widget(iframe);
    _scWidget.bind(SC.Widget.Events.READY,function(){_scReady=true;if(_pendingUrl){_scWidget.load(_pendingUrl,{auto_play:true});_pendingUrl=null;}});
    _scWidget.bind(SC.Widget.Events.PLAY,function(){
      _scPlaying=true;startDanceAnim();
      _scWidget.getCurrentSound(function(s){if(s){_curTrackTitle=s.title||'';_curTrackDur=s.duration||0;updateTrackUI();}});
      startProgTimer();
    });
    _scWidget.bind(SC.Widget.Events.PLAY_PROGRESS,function(e){_curTrackPos=e.currentPosition||0;updateProgBar();});
    _scWidget.bind(SC.Widget.Events.PAUSE,function(){_scPlaying=false;stopDanceAnim();stopProgTimer();});
    _scWidget.bind(SC.Widget.Events.FINISH,function(){_scPlaying=false;stopDanceAnim();stopProgTimer();_curTrackPos=0;updateProgBar();});
  }catch(e){}
}
function scLoadAndPlay(url){
  if(!url)return;
  if(_scWidget&&_scReady){_scWidget.load(url,{auto_play:_scPlaying});}
  else{_pendingUrl=url;var iframe=g('sc-widget');if(iframe){iframe.src='https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&color=%232C4A1E&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false';_scReady=false;_scWidget=null;setTimeout(initScWidget,800);}}
}
function updateTrackUI(){var e=g('sc-track-title');if(e&&_curTrackTitle)e.textContent=_curTrackTitle;}
function msToTime(ms){var s=Math.floor(ms/1000),m=Math.floor(s/60);s=s%60;return m+':'+(s<10?'0':'')+s;}
function updateProgBar(){var b=g('sc-prog-fill'),t=g('sc-time-cur');if(b&&_curTrackDur>0)b.style.width=Math.min((_curTrackPos/_curTrackDur)*100,100)+'%';if(t)t.textContent=msToTime(_curTrackPos);}
function startProgTimer(){stopProgTimer();_progTimer=setInterval(function(){if(_scWidget&&_scReady&&_scPlaying)_scWidget.getPosition(function(p){_curTrackPos=p||0;updateProgBar();});},1000);}
function stopProgTimer(){if(_progTimer){clearInterval(_progTimer);_progTimer=null;}}
function startDanceAnim(){var e=g('surak-char-wrap');if(e)e.classList.add('dancing');}
function stopDanceAnim(){var e=g('surak-char-wrap');if(e)e.classList.remove('dancing');}

/* ═══ GPS ═══ */
function calcDist(a,b,c,d){var R=6371000,dL=(c-a)*Math.PI/180,dG=(d-b)*Math.PI/180;var x=Math.sin(dL/2)*Math.sin(dL/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dG/2)*Math.sin(dG/2);return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function getNearestZone(lat,lng){var near=null,min=Infinity;GPS_ZONES.forEach(function(z){var d=calcDist(lat,lng,z.lat,z.lng);if(d<min){min=d;near=z;}});return{zone:near,dist:Math.round(min)};}
function updateGpsUI(state,txt,color){var dot=g('gps-dot'),te=g('gps-status-text');if(dot)dot.style.background=color||'#bbb';if(te)te.textContent=txt||'';}
function showGpsToast(msg){var t=g('gps-toast');if(!t)return;t.textContent=msg;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(function(){t.style.opacity='0';},3000);}
function onZoneEnter(zone){
  if(_lastZone&&_lastZone.id===zone.id)return;_lastZone=zone;
  if(_userOverride)return;
  _currentMode=zone.mode;_currentPlayUrl=SC_PLAYLISTS[zone.mode]?SC_PLAYLISTS[zone.mode].default:null;
  var lbl=zone.label[lang]||zone.label.KO;showGpsToast(lbl);
  if(_currentPlayUrl&&_scPlaying)scLoadAndPlay(_currentPlayUrl);
  var sv2=g('sound-view');if(sv2&&sv2.classList.contains('on'))renderSound();
  updateGpsUI('zone',lbl,'var(--ac)');
}
function startGPS(){
  if(!navigator.geolocation){updateGpsUI('error','GPS 미지원','#C4882A');return;}
  _gpsActive=true;updateGpsUI('searching','GPS 위치 찾는 중...','#C4882A');
  _gpsWatcher=navigator.geolocation.watchPosition(
    function(pos){var r=getNearestZone(pos.coords.latitude,pos.coords.longitude);var z=r.zone,d=r.dist;if(d<=z.radius){onZoneEnter(z);updateGpsUI('zone',(z.label[lang]||z.label.KO)+' ('+d+'m)','var(--ac)');}else{updateGpsUI('nearby',(z.label[lang]||z.label.KO)+' '+d+'m','#6B6454');} },
    function(err){var em={0:'GPS 오류',1:'위치 권한 거부',2:'위치 없음',3:'GPS 시간 초과'};updateGpsUI('error',em[err.code]||'GPS 오류','var(--re)');},
    {enableHighAccuracy:true,maximumAge:10000,timeout:15000}
  );
}
function stopGPS(){if(_gpsWatcher!==null){navigator.geolocation.clearWatch(_gpsWatcher);_gpsWatcher=null;} _gpsActive=false;_lastZone=null;updateGpsUI('off','GPS 꺼짐','#bbb');}
function toggleGPS(){if(_gpsActive)stopGPS();else startGPS();var sv2=g('sound-view');if(sv2&&sv2.classList.contains('on'))renderSound();}
function testGpsZone(zoneId){var zone=GPS_ZONES.find(function(z){return z.id===zoneId;});if(!zone)return;_userOverride=false;_lastZone=null;onZoneEnter(zone);updateGpsUI('zone','[TEST] '+(zone.label[lang]||zone.label.KO),'var(--ac)');}

/* ═══ 지도 ═══ */
function _placeMarker(s){
  if(!_map||!s.lat||!s.lng)return;
  var cols={food:'#4A7A35',gogi:'#8B3A2A',cafe:'#2A558B',bar:'#6B3A8B',outdoor:'#6B6B2A'};
  var col=cols[s.cat]||'#2C4A1E';
  var nm=s.ko;
  var markerHtml='<div onclick="openPopup(STORES.find(function(x){return x.id==='+s.id+'}))" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;">'
    +'<div style="background:'+col+';color:#fff;font-size:11px;font-weight:700;padding:5px 10px;border-radius:12px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);max-width:90px;overflow:hidden;text-overflow:ellipsis;border:1.5px solid rgba(255,255,255,.3);">'+nm+'</div>'
    +'<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid '+col+';"></div>'
    +'</div>';
  var m=new naver.maps.Marker({
    position:new naver.maps.LatLng(s.lat,s.lng),
    map:_map,
    icon:{content:markerHtml,anchor:new naver.maps.Point(45,36)},
    clickable:true
  });
  (function(store){
    naver.maps.Event.addListener(m,'click',function(){openPopup(store);});
  })(s);
  _markers.push(m);
}
function _buildMapFilter(){
  var el=g('map-flt');if(!el)return;
  var L=function(o){return o[lang]||o.KO;};
  var cats=[
    {k:'all',    ic:'🗺️',l:{KO:'전체',EN:'All',JP:'全て',CN:'全部'},n:STORES.length},
    {k:'food',   ic:'🍽️',l:{KO:'식당',EN:'Food',JP:'食堂',CN:'餐饮'}},
    {k:'gogi',   ic:'🥩',l:{KO:'고기',EN:'BBQ',JP:'焼肉',CN:'烤肉'}},
    {k:'cafe',   ic:'☕',l:{KO:'카페',EN:'Café',JP:'カフェ',CN:'咖啡'}},
    {k:'bar',    ic:'🍺',l:{KO:'바/야간',EN:'Bar',JP:'バー',CN:'酒吧'}},
    {k:'onuri',  ic:'🏷️',l:{KO:'온누리',EN:'Onuri',JP:'オヌリ',CN:'温누리'}},
    {k:'toilet', ic:'🚻',l:{KO:'화장실',EN:'Restroom',JP:'トイレ',CN:'厕所'}},
  ];
  cats.forEach(function(c){
    if(c.k!=='all'&&c.k!=='onuri'&&c.k!=='toilet')
      c.n=STORES.filter(function(s){return s.cat===c.k;}).length;
    else if(c.k==='onuri')
      c.n=STORES.filter(function(s){return s.onuri;}).length;
    else if(c.k==='toilet')
      c.n=3;
  });
  el.innerHTML='';
  cats.forEach(function(c){
    var btn=document.createElement('button');
    btn.className='mfc'+(c.k===_curFilter?' on':'');
    btn.innerHTML='<span class="mfc-ic">'+c.ic+'</span>'+L(c.l)+(c.n?' <span style="opacity:.7;font-size:9px;">'+c.n+'</span>':'');
    btn.onclick=function(){
      _curFilter=c.k;
      el.querySelectorAll('.mfc').forEach(function(b){b.classList.remove('on');});
      this.classList.add('on');
      _renderMarkers();
      renderMapList();
    };
    el.appendChild(btn);
  });
}
function _renderMarkers(){
  _markers.forEach(function(m){m.setMap(null);});_markers=[];
  var TOILET_LOCS=[
    {lat:37.6745,lng:127.058,nm:{KO:'수락산역 화장실',EN:'Station Restroom',JP:'駅トイレ',CN:'车站厕所'}},
    {lat:37.6761,lng:127.056,nm:{KO:'벽운지맥 입구 화장실',EN:'Trail Entry Restroom',JP:'登山口トイレ',CN:'登山口厕所'}},
    {lat:37.6634,lng:127.061,nm:{KO:'물개바위 화장실',EN:'Mulgae Rock Restroom',JP:'물개岩トイレ',CN:'海狗岩厕所'}}
  ];
  if(_curFilter==='toilet'){
    TOILET_LOCS.forEach(function(t){
      var m=new naver.maps.Marker({
        position:new naver.maps.LatLng(t.lat,t.lng),map:_map,
        icon:{content:'<div style="background:#2A558B;color:#fff;font-size:12px;padding:4px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);">🚻</div>',anchor:new naver.maps.Point(20,15)}
      });
      naver.maps.Event.addListener(m,'click',function(){showGpsToast((t.nm[lang]||t.nm.KO));});
      _markers.push(m);
    });
    return;
  }
  /* 오공김밥 먼저 마커 배치 */
  var oGong=STORES.find(function(s){return s.id===1;});
  if(oGong&&oGong.lat&&oGong.lng)_placeMarker(oGong);
  STORES.forEach(function(s){
    if(s.id===1)return; /* 오공김밥 중복 방지 */
    if(!s.lat||!s.lng)return;
    if(_curFilter==='all'){}
    else if(_curFilter==='onuri'){if(!s.onuri)return;}
    else if(s.cat!==_curFilter)return;
    var cols={food:'#4A7A35',gogi:'#8B3A2A',cafe:'#2A558B',bar:'#6B3A8B',outdoor:'#6B6B2A'};
    var col=cols[s.cat]||'#2C4A1E';
    var nm=lang==='EN'?s.en:lang==='JP'?s.jp:lang==='CN'?s.cn:s.ko;
    var onuriTag=s.onuri?'<span style="background:#C41E3A;color:#fff;font-size:8px;padding:1px 4px;border-radius:4px;margin-left:3px;">온누리</span>':'';
    var markerHtml='<div onclick="openPopup(STORES.find(function(x){return x.id==='+s.id+'}))" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;">'
      +'<div style="background:'+col+';color:#fff;font-size:11px;font-weight:700;padding:5px 10px;border-radius:12px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);max-width:90px;overflow:hidden;text-overflow:ellipsis;border:1.5px solid rgba(255,255,255,.3);display:flex;align-items:center;">'+nm+onuriTag+'</div>'
      +'<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid '+col+';"></div>'
      +'</div>';
    var m=new naver.maps.Marker({
      position:new naver.maps.LatLng(s.lat,s.lng),map:_map,
      icon:{content:markerHtml,anchor:new naver.maps.Point(45,36)},clickable:true
    });
    (function(store){naver.maps.Event.addListener(m,'click',function(){openPopup(store);});})(s);
    _markers.push(m);
  });
}
function _geocodeAll(){
  /* v12: 하드코딩 좌표 우선 - 캐시 무시 */
  localStorage.removeItem('surak_coords_v11');
  var el=g('map-status'),total=STORES.length,done=0;
  function onDone(){done++;if(el)el.textContent=T('loading')+' '+done+'/'+total;if(done===total){if(el){el.style.opacity='0';setTimeout(function(){el.style.display='none';},500);}_buildMapFilter();}}
  /* 오공김밥 먼저 마커 배치 */
  var oGong=STORES.find(function(s){return s.id===1;});
  if(oGong&&oGong.lat&&oGong.lng)_placeMarker(oGong);
  STORES.forEach(function(s){
    if(s.id===1)return; /* 오공김밥 중복 방지 */
    /* 하드코딩 좌표가 있으면 geocoding 불필요 */
    if(s.lat&&s.lng){_placeMarker(s);onDone();return;}
    naver.maps.Service.geocode({query:s.addr},function(st,res){
      if(st===naver.maps.Service.Status.OK&&res.v2.addresses.length){var a=res.v2.addresses[0];s.lat=parseFloat(a.y);s.lng=parseFloat(a.x);} _placeMarker(s);
      onDone();
    });
  });
}
function _initMap(){
  if(!_mapReady||_map)return;
  _map=new naver.maps.Map('naver-map',{center:new naver.maps.LatLng(37.674900,127.058394),zoom:16,mapTypeId:naver.maps.MapTypeId.NORMAL,zoomControl:true,zoomControlOptions:{style:naver.maps.ZoomControlStyle.SMALL,position:naver.maps.Position.TOP_RIGHT}});
  _iw=new naver.maps.InfoWindow({backgroundColor:'var(--sf)',borderColor:'var(--ac)',borderWidth:2,anchorSkew:true,pixelOffset:new naver.maps.Point(0,-8)});
  _buildMapFilter();_geocodeAll();
  setTimeout(renderMapList, 500);
}

/* ═══ 팝업 (스크롤형, 탭 없음) ═══ */
function openPopup(s){
  var pop=g('pop');if(!pop)return;
  var nm=lang==='EN'?s.en:lang==='JP'?s.jp:lang==='CN'?s.cn:s.ko;
  se('pop-nm',nm);se('pop-addr',s.addr);
  // 온누리상품권 표시
  var onuriEl=g('pop-onuri-badge');
  if(onuriEl)onuriEl.style.display=s.onuri?'inline-block':'none';
  var catColors={food:'#4A7A35',gogi:'#8B3A2A',cafe:'#2A558B',bar:'#6B3A8B',outdoor:'#6B6B2A'};
  var catNames={food:{KO:'식사',EN:'Food',JP:'食事',CN:'餐饮'},gogi:{KO:'고기',EN:'BBQ',JP:'焼肉',CN:'烤肉'},cafe:{KO:'카페',EN:'Café',JP:'カフェ',CN:'咖啡'},bar:{KO:'바/야간',EN:'Bar',JP:'バー',CN:'酒吧'},outdoor:{KO:'아웃도어',EN:'Outdoor',JP:'アウトドア',CN:'户外'}};
  var cb=g('pop-cat-badge');
  if(cb){cb.textContent=(catNames[s.cat]&&catNames[s.cat][lang])||s.cat;cb.style.cssText='display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:4px;background:'+(catColors[s.cat]||'var(--ac)')+'22;color:'+(catColors[s.cat]||'var(--ac)')+';border:1px solid '+(catColors[s.cat]||'var(--ac)')+'44;';}
  var gKey=CAT_GOODS[s.cat]||'keyring';
  var gInfo={keyring:{icon:'🗝️',nm:{KO:'식당 키링',EN:'Restaurant Keyring',JP:'食堂キーリング',CN:'餐厅钥匙扣'}},tumbler:{icon:'🥤',nm:{KO:'카페 텀블러',EN:'Café Tumbler',JP:'カフェタンブラー',CN:'咖啡杯'}},sock:{icon:'🧦',nm:{KO:'고기 양말',EN:'BBQ Socks',JP:'焼肉ソックス',CN:'烤肉袜'}},bandana:{icon:'🪢',nm:{KO:'바 반다나',EN:'Bar Bandana',JP:'バーバンダナ',CN:'酒吧头巾'}},cap:{icon:'🧢',nm:{KO:'수락 캡',EN:'Surak Cap',JP:'スラクキャップ',CN:'水落帽'}}};
  var desc=lang==='EN'?s.den:lang==='JP'?s.djp:lang==='CN'?s.dcn:s.dko;
  var gi=gInfo[gKey]||gInfo.keyring;
  var gnm=gi.nm[lang]||gi.nm.KO;
  var gCollected=hasGoods(gKey);
  var imgs=STORE_IMGS[s.cat]||STORE_IMGS.food;
  var h='';

  /* 이미지 슬라이더 */
  h+='<div class="pop-img-slider">';
  imgs.forEach(function(src,i){
    h+='<div class="pop-img-item"><img src="'+src+'" alt="'+nm+' '+(i+1)+'"/></div>';
  });
  h+='</div>';

  /* ① 매장 정보 */
  h+='<div class="pop-sec"><div class="pop-sec-title">'+T('popInfo')+'</div>';
  if(desc)h+='<div style="font-size:13px;color:var(--t2);line-height:1.75;margin-bottom:10px;padding:12px;background:var(--sf2);border-radius:var(--r2);">'+desc+'</div>';
  h+='<div class="info-row"><span class="info-label">⏰</span><span class="info-val">'+s.hours+'</span></div>';
  h+='<div class="info-row"><span class="info-label">📍</span><span class="info-val" style="font-size:11px;">'+s.addr+'</span></div>';
  h+='</div>';

  /* 매장 레벨 + 내 스탬프/방문 (서버에서 채움) */
  h+='<div class="pop-sec"><div class="pop-sec-title">🏅 '+({KO:'매장 레벨',EN:'Store Level',JP:'店舗レベル',CN:'店铺等级'}[lang]||'매장 레벨')+'</div><div id="pop-storelv"><div style="font-size:12px;color:var(--t3);">불러오는 중...</div></div></div>';

  /* ② 메뉴 */
  if(s.menus&&s.menus.length){
    h+='<div class="pop-sec"><div class="pop-sec-title">'+T('popMenu')+'</div>';
    s.menus.forEach(function(m,i){
      var mnm=lang==='EN'?m.en:lang==='JP'?m.jp:lang==='CN'?m.cn:m.ko;
      var isSig=i<3;
      h+='<div class="menu-row" style="'+(isSig?'background:var(--acbg);border:1px solid rgba(44,74,30,.12);':'')+'">';
      h+='<span class="menu-nm">'+(isSig?'⭐ ':'')+mnm+'</span><span class="menu-pr">'+m.p+'</span></div>';
    });
    h+='</div>';
  }

  /* ③ 굿즈 */
  h+='<div class="pop-sec"><div class="pop-sec-title">'+T('popGoods')+'</div>';
  h+='<div class="pop-goods-card"><div class="pop-goods-ic">'+gi.icon+'</div><div class="pop-goods-nm">'+gnm+'</div><div class="pop-goods-desc">'+T('popVisit')+' → SNS → '+T('popCollect')+'</div></div>';
  h+='<button id="goods-collect-btn" data-gkey="'+gKey+'" style="width:100%;padding:14px;border-radius:var(--r3);font-size:15px;font-weight:800;cursor:pointer;border:2px solid var(--ac);background:'+(gCollected?'var(--acbg)':'var(--ac)')+';color:'+(gCollected?'var(--ac)':'#fff')+';">'+(gCollected?T('popCollected'):T('popCollect'))+'</button>';
  h+='</div>';

  var pb=g('pop-body');if(pb)pb.innerHTML=h;
  fillStoreLevel(s.id);
  var cbtn=g('goods-collect-btn');
  if(cbtn)cbtn.addEventListener('click',function(){
    var k=this.getAttribute('data-gkey'),now=toggleGoods(k);
    this.textContent=now?T('popCollected'):T('popCollect');
    this.style.background=now?'var(--acbg)':'var(--ac)';this.style.color=now?'var(--ac)':'#fff';
    var gi2=g('goods-inner');if(gi2)renderGoods();
  });
  pop.style.display='flex';pop.style.alignItems='flex-end';pop.style.justifyContent='center';
  setTimeout(function(){pop.classList.add('on');},10);
}
function closePopup(){var pop=g('pop');if(!pop)return;pop.classList.remove('on');setTimeout(function(){pop.style.display='none';},320);}
// 매장 레벨(A안: visitXp 100/300/700) + 내 스탬프/방문 — 서버에서 채움
var STORE_LV_TBL=[0,100,300,700];
function storeLevelOf(vx){var lv=1;for(var i=0;i<STORE_LV_TBL.length;i++){if((vx||0)>=STORE_LV_TBL[i])lv=i+1;}return{lv:lv,next:STORE_LV_TBL[lv],base:STORE_LV_TBL[lv-1],xp:vx||0};}
function fillStoreLevel(storeId){
  var sec=g('pop-storelv');if(!sec)return;
  if(typeof FB==='undefined'||!FB.ready){var v=(typeof getStoreVisits==='function')?(getStoreVisits()[storeId]||0):0;sec.innerHTML='<div style="font-size:13px;color:var(--t2);">내 방문 '+v+'회 (서버 연결 시 매장 레벨 표시)</div>';return;}
  FB.db.collection('stores').doc(String(storeId)).get().then(function(ss){
    var vx=(ss.exists&&ss.data().visitXp)||0,vc=(ss.exists&&ss.data().visitCount)||0,sl=storeLevelOf(vx);
    var pct=sl.next?Math.min(100,Math.round((sl.xp-sl.base)/((sl.next-sl.base)||1)*100)):100;
    var html='<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;"><div style="font-size:24px;font-weight:800;color:var(--ac);">Lv.'+sl.lv+'</div>'
      +'<div style="flex:1;"><div style="font-size:11px;color:var(--t3);margin-bottom:3px;">매장 경험치 '+sl.xp+'XP'+(sl.next?(' · 다음 '+sl.next+'XP'):' · MAX')+'</div>'
      +'<div style="height:6px;background:var(--bd);border-radius:3px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:var(--ac);transition:width .5s;"></div></div></div></div>'
      +'<div style="font-size:12px;color:var(--t2);">누적 방문 '+vc+'회</div>';
    if(FB.user){FB.db.collection('stamps').doc(FB.user.uid+'_'+storeId).get().then(function(st){var c=(st.exists&&st.data().count)||0;sec.innerHTML=html+'<div style="font-size:13px;color:var(--ac);font-weight:700;margin-top:6px;">🎟️ 내 스탬프 '+c+'개</div>';}).catch(function(){sec.innerHTML=html;});}
    else sec.innerHTML=html;
  }).catch(function(){sec.innerHTML='<div style="font-size:12px;color:var(--t3);">레벨 정보를 불러올 수 없어요.</div>';});
}

/* ═══ 홈 탭 ═══ */
function renderHome(){
  var L=function(o){return o[lang]||o.KO;};
  var wrap=document.getElementById('home-scroll-inner');
  if(!wrap)return;
  se('t-hero-title',{KO:'수락 스트릿',EN:'Surak Street',JP:'スラクストリート',CN:'水落街'}[lang]||'수락 스트릿');
  var html='';
  html+='<div class="home-weather-card">';
  html+='<div class="hwc-top"><div><div id="hw-ico2" style="font-size:32px;line-height:1;margin-bottom:2px;">🌤️</div>';
  html+='<div id="hw-desc2" style="font-size:12px;opacity:.75;">'+L({KO:'불러오는 중...',EN:'Loading...',JP:'取得中...',CN:'加载中...'})+'</div></div>';
  html+='<div style="text-align:right;"><div id="hw-temp2" style="font-size:44px;font-weight:800;line-height:1;">--°C</div></div></div>';
  html+='<div class="hwc-stats">';
  html+='<div class="hwc-stat"><div class="hwc-stat-v" id="hw-wind2">--</div><div class="hwc-stat-l">'+L({KO:'풍속',EN:'Wind',JP:'風速',CN:'风速'})+'</div></div>';
  html+='<div class="hwc-stat"><div class="hwc-stat-v" id="hw-hum2">--</div><div class="hwc-stat-l">'+L({KO:'습도',EN:'Humidity',JP:'湿度',CN:'湿度'})+'</div></div>';
  html+='<div class="hwc-stat"><div class="hwc-stat-v" id="hw-hike2" style="color:#90E8A0;">--</div><div class="hwc-stat-l">'+L({KO:'등산',EN:'Hiking',JP:'登山',CN:'登山'})+'</div></div>';
  html+='</div></div>';
  html+='<div class="descend-card safe" id="descend-card">';
  html+='<div class="dc-ic">⏰</div>';
  html+='<div style="flex:1;"><div class="dc-title" id="dc-title">'+L({KO:'하산 권장 시간',EN:'Descent Time',JP:'下山推奨時間',CN:'建议下山时间'})+'</div>';
  html+='<div class="dc-desc" id="dc-desc">'+L({KO:'일몰 1시간 전까지 하산',EN:'1hr before sunset',JP:'日没1時間前に下山',CN:'日落前1小时下山'})+'</div></div>';
  html+='<div class="dc-time safe" id="dc-time">18:30</div></div>';
  var lms=TRAILS[0].landmarks||[];

  html+='<div class="course-card" id="course-card-btn">';
  html+='<div class="course-card-top">';
  html+='<div><div class="cc-label">TODAY&#39;S COURSE</div>';
  html+='<div class="cc-title">'+L({KO:'수락산 주봉 코스',EN:'Suraksan Summit',JP:'水落山主峰コース',CN:'水락山主峰路线'})+'</div></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;">';
  html+='<div class="cc-arrow">›</div>';
  html+='<button onclick="event.stopPropagation();openHomePopup(\'safety\')" style="padding:4px 10px;background:rgba(0,0,0,.12);border:none;border-radius:20px;font-size:10px;font-weight:700;color:#fff;cursor:pointer;">⛑️ '+L({KO:'안전정보',EN:'Safety',JP:'安全',CN:'安全'})+'</button>';
  html+='</div></div>';
  html+='<div class="course-card-body">';
  html+='<div class="cc-stats">';
  html+='<div class="cc-stat"><span class="cc-stat-ic">📏</span><span class="cc-stat-v">8.2km</span></div>';
  html+='<div class="cc-stat"><span class="cc-stat-ic">⏱</span><span class="cc-stat-v">'+L({KO:'4시간',EN:'4hrs',JP:'4時間',CN:'4小时'})+'</span></div>';
  html+='<div class="cc-stat"><span class="cc-stat-ic">⚡</span><span class="cc-stat-v">'+L({KO:'중급',EN:'Intermediate',JP:'中級',CN:'中级'})+'</span></div>';
  html+='</div>';
  html+='<div class="course-steps">';
  lms.forEach(function(l,i){
    var nm=L(l.name);if(nm.length>5)nm=nm.substring(0,5)+'..';
    html+='<div class="cs-item"><div class="cs-dot'+(i===lms.length-1?' summit':'')+'"></div>';
    html+='<div class="cs-name">'+l.icon+'<br>'+nm+'</div></div>';
    if(i<lms.length-1)html+='<div class="cs-line" style="margin-top:4px;align-self:flex-start;"></div>';
  });
  html+='</div>';
  html+='<div style="font-size:11px;color:var(--t3);margin-top:8px;text-align:right;">'+L({KO:'탭하여 자세히 보기 →',EN:'Tap for details →',JP:'タップで詳細 →',CN:'点击查看详情 →'})+'</div>';
  html+='</div></div>';
  /* 수락 이야기 카드 슬라이더 */
  html+='<div class="stit">📜 '+L({KO:'수락산 인물 이야기',EN:'SURAKSAN LEGENDS',JP:'スラクサン人物語',CN:'水落山人物故事'})+'</div>';
  html+='<div id="story-cards" style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none;">';
  var STORY_CARDS=[
    {idx:0,ic:'🖊️',bg:'linear-gradient(135deg,#0d2b1a,#1a4a2e)',color:'#FFFFFF',
     t:{KO:'천상병 시인',EN:'Poet Cheon',JP:'千尚炳詩人',CN:'诗人千尚炳'},
     s:{KO:'이 세상 소풍 끝내는 날…',EN:'When this picnic ends…',JP:'この世の遠足が終わる日…',CN:'当郊游结束那天…'}},
    {idx:1,ic:'📚',bg:'linear-gradient(135deg,#0d1b30,#1a2a4a)',color:'#FFFFFF',
     t:{KO:'김시습',EN:'Kim Si-seup',JP:'金時習',CN:'金时习'},
     s:{KO:'5살에 세종대왕을 감탄시킨 천재',EN:'The prodigy who stunned Sejong',JP:'5歳で世宗を感嘆させた天才',CN:'5岁让世宗惊叹的天才'}},
    {idx:2,ic:'🌙',bg:'linear-gradient(135deg,#1a0d30,#2a1a4a)',color:'#FFFFFF',
     t:{KO:'인현왕후',EN:'Queen Inhyeon',JP:'仁顕王后',CN:'仁显王后'},
     s:{KO:'장희빈에 맞선 수락산의 기적',EN:'Suraksan miracle vs. Jang Hee-bin',JP:'張禧嬪に立ち向かった奇跡',CN:'对抗张禧嫔的水落山奇迹'}},
    {idx:3,ic:'📖',bg:'linear-gradient(135deg,#0a2a1a,#0f3a25)',color:'#FFFFFF',
     t:{KO:'박세당',EN:'Park Se-dang',JP:'朴世堂',CN:'朴世堂'},
     s:{KO:'삼각산보다 수락산이 으뜸!',EN:'Suraksan beats Bukhansan!',JP:'三角山より水落山が上！',CN:'水落山胜过三角山！'}},
    {idx:4,ic:'🏛️',bg:'linear-gradient(135deg,#2a200a,#3a2f0f)',color:'#FFFFFF',
     t:{KO:'황희 정승',EN:'Minister Hwang Hee',JP:'黄喜政丞',CN:'黄喜政丞'},
     s:{KO:'수락(水落)의 이름을 탄생시킨 한 마디',EN:'The words that named Suraksan',JP:'スラクサンの名を生んだ言葉',CN:'诞生水落山之名的那句话'}},
    {idx:5,ic:'⚔️',bg:'linear-gradient(135deg,#2a0a0a,#3a1010)',color:'#FFFFFF',
     t:{KO:'이성계',EN:'Yi Seonggye',JP:'李成桂',CN:'李成桂'},
     s:{KO:'삐쳐서 서울에 등 돌린 반역산',EN:'The mountain that turned its back',JP:'背を向けた逆賊山',CN:'背对首尔的逆贼山'}},
    {idx:6,ic:'🏯',bg:'linear-gradient(135deg,#0d0d2b,#1a1a4a)',color:'#FFFFFF',
     t:{KO:'정조 대왕',EN:'King Jeongjo',JP:'正祖大王',CN:'正祖大王'},
     s:{KO:'백일기도 끝에 탄생한 순조',EN:'Sunjo born after 100-day prayer',JP:'百日祈祷の末の純祖誕生',CN:'百日祈祷后诞生的纯祖'}},
    {idx:7,ic:'🔥',bg:'linear-gradient(135deg,#2a0505,#400a0a)',color:'#FFFFFF',
     t:{KO:'연산군',EN:'Yeonsangun',JP:'燕山君',CN:'燕山君'},
     s:{KO:'민초들의 저주가 서린 수락산',EN:'Suraksan cursed by the people',JP:'民衆の呪いが宿るスラクサン',CN:'民众诅咒萦绕的水落山'}},
    {idx:8,ic:'🖌️',bg:'linear-gradient(135deg,#150d2a,#22134a)',color:'#FFFFFF',
     t:{KO:'흥선대원군',EN:'Heungseon Daewongun',JP:'興宣大院君',CN:'兴宣大院君'},
     s:{KO:'수락산을 글씨로 도배한 야망',EN:'Ambition written across the mountain',JP:'書で山を埋めた野望',CN:'用书法占领山头的野心'}},
    {idx:9,ic:'🎨',bg:'linear-gradient(135deg,#050f1a,#0a1e2e)',color:'#FFFFFF',
     t:{KO:'겸재 정선',EN:'Jeong Seon',JP:'謙斎鄭敾',CN:'谦斋郑敾'},
     s:{KO:'300년 전 그 각도 그대로',EN:'The same angle, 300 years later',JP:'300年前と同じ角度',CN:'300年后相同的角度'}},
    {idx:10,ic:'🕯️',bg:'linear-gradient(135deg,#0a0a0a,#1a1a1a)',color:'#FFFFFF',
     t:{KO:'야화 ① 엄흥도×김시습',EN:'Tale① Eom & Kim',JP:'夜話①厳興道×金時習',CN:'夜话①严兴道×金时习'},
     s:{KO:'영화 속 그 장면이 수락산에서…',EN:'That movie scene happened here…',JP:'映画のあのシーンがスラクサンで…',CN:'电影中那一幕就发生在水落山…'}},
    {idx:11,ic:'🐯',bg:'linear-gradient(135deg,#041a10,#082a18)',color:'#FFFFFF',
     t:{KO:'야화 ② 호랑이·김삿갓·한석봉',EN:'Tale② Tiger·Satgat·Seokbong',JP:'夜話②虎·金笠·韓石峯',CN:'夜话②老虎·金笠·韩石峯'},
     s:{KO:'수락산을 사랑한 천재들의 야사',EN:'Secret tales of Suraksan\'s geniuses',JP:'スラクサンを愛した天才たちの野史',CN:'热爱水落山的天才们的野史'}}
  ];
  var _ILL=['https://machojang-create.github.io/surak-demo/cheon.png','https://machojang-create.github.io/surak-demo/kimsiseup.png','https://machojang-create.github.io/surak-demo/inhyeon.png','https://machojang-create.github.io/surak-demo/parksedang.png','https://machojang-create.github.io/surak-demo/hwanghui.png','https://machojang-create.github.io/surak-demo/leeseonggye.png','https://machojang-create.github.io/surak-demo/leehwang.png','https://machojang-create.github.io/surak-demo/yeonsangun.png','https://machojang-create.github.io/surak-demo/heungseon.png','https://machojang-create.github.io/surak-demo/jeongseon.png','https://machojang-create.github.io/surak-demo/eomheungdo.png','https://machojang-create.github.io/surak-demo/kimsatgat.png','https://machojang-create.github.io/surak-demo/jeongjo.png','https://machojang-create.github.io/surak-demo/deokhye.png','https://machojang-create.github.io/surak-demo/hanseokbong.png','https://machojang-create.github.io/surak-demo/seonjo.png'];
  STORY_CARDS.forEach(function(c){
    var ill=_ILL[c.idx]||'';
    /* 반투명 배경: 이미지+색상 레이어 */
    var bgStyle=ill
      ? 'background-image:url('+ill+');background-size:contain;background-position:center bottom;background-repeat:no-repeat;'
      : '';
    html+='<div onclick="openStoryModal('+c.idx+')" style="flex-shrink:0;width:156px;'+bgStyle+'background-color:'+c.bg+';border-radius:14px;padding:16px 14px 14px;cursor:pointer;border:1px solid rgba(255,255,255,.1);position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.3);">';
    /* 반투명 오버레이 - 배경 이미지 위에 색상 씌워 가독성 확보 */
    if(ill)html+='<div style="position:absolute;inset:0;background:'+c.bg+';opacity:.65;"></div>';
    html+='<div style="position:relative;z-index:1;">';
    html+='<div style="font-size:26px;margin-bottom:10px;">'+c.ic+'</div>';
    html+='<div style="font-size:13px;font-weight:800;color:'+c.color+';margin-bottom:6px;line-height:1.3;letter-spacing:-.2px;">'+L(c.t)+'</div>';
    html+='<div style="font-size:11px;color:rgba(255,255,255,.75);line-height:1.5;">'+L(c.s)+'</div>';
    html+='</div>';
    html+='<div style="position:absolute;right:10px;bottom:10px;font-size:16px;color:rgba(255,255,255,.3);z-index:1;">›</div>';
    html+='</div>';
  });
  html+='</div>';


  /* 🎮 미니게임 배너 제거됨 (명세 §1.3 — MVP 미니게임 제외) */

  /* 빠른메뉴 제거됨 */
  html+='<div class="stit">'+T('homeHotTitle')+'</div>';
  html+='<div class="hot-row" id="hot-list2"></div>';


  wrap.innerHTML=html;
  var ccBtn=document.getElementById('course-card-btn');
  if(ccBtn)ccBtn.addEventListener('click',function(){openHomePopup('course');});
  document.querySelectorAll('[data-gameid]').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      openGameModal(this.getAttribute('data-gameid'));
    });
  });
  /* hl-chat-btn 제거됨 */
  /* story cards rendered inline */
  /* surak-chat-banner 제거됨 */
  /* hl-runway-btn 제거됨 */
  /* onuriBtn 제거됨 */
  /* onuriBtn 이벤트 제거됨 */
  wrap.querySelectorAll('.qb[data-popup-type]').forEach(function(btn){
    btn.addEventListener('click',function(){
      if(this.dataset.popupType==='goods'){var t=document.querySelector('.tab[data-v="goods"]');if(t)t.click();}
      else openHomePopup(this.dataset.popupType);
    });
  });
  wrap.querySelectorAll('[data-sv]').forEach(function(card){
    card.addEventListener('click',function(){sv(this.dataset.sv);});
  });
  var hl=document.getElementById('hot-list2');
  if(hl){
    var catEmojis={food:'🍽️',gogi:'🥩',cafe:'☕',bar:'🍺',outdoor:'⛰️'};
    var catColors={food:'#E8F4E8',gogi:'#FDE8E8',cafe:'#E8EEF8',bar:'#F0E8F8'};
    var seen={};var hotStores=STORES.filter(function(s){
      if(seen[s.addr])return false;seen[s.addr]=true;return true;
    }).sort(function(a,b){return (a.dist||999)-(b.dist||999);}).slice(0,8);
    hotStores.forEach(function(s){
      var nm=lang==='EN'?s.en:lang==='JP'?s.jp:lang==='CN'?s.cn:s.ko;
      var div=document.createElement('div');div.className='hot-card';
      div.innerHTML='<div class="hot-img" style="background:'+(catColors[s.cat]||'#F0F0F0')+'">'+(catEmojis[s.cat]||'🏪')+'</div>'
        +'<div class="hot-body"><div class="hot-nm">'+nm+'</div><div class="hot-meta">'+s.dist+'m</div></div>';
      div.onclick=function(){openPopup(s);};
      hl.appendChild(div);
    });
  }
  fetchWeather(function(wd){
    if(!wd)return;
    var ico=document.getElementById('hw-ico2'),tmp=document.getElementById('hw-temp2'),desc=document.getElementById('hw-desc2');
    var wind=document.getElementById('hw-wind2'),hum=document.getElementById('hw-hum2'),hike=document.getElementById('hw-hike2');
    var dc=document.getElementById('descend-card'),dctitle=document.getElementById('dc-title'),dcdesc=document.getElementById('dc-desc'),dctime=document.getElementById('dc-time');
    if(ico)ico.textContent=weatherIcon(wd.code);
    if(tmp)tmp.textContent=wd.temp+'°C';
    if(desc)desc.textContent=weatherDesc(wd.code);
    if(wind)wind.textContent=wd.wind+'m/s';
    if(hum)hum.textContent=wd.hum+'%';
    var ok=hikingOk(wd.code,wd.temp);
    if(hike)hike.textContent=ok?L({KO:'좋음 ✅',EN:'Good ✅',JP:'良い✅',CN:'良好✅'}):L({KO:'주의 ⚠️',EN:'Caution⚠️',JP:'注意⚠️',CN:'注意⚠️'});
    var now=new Date(),dH=18,dM=30;
    var remainMin=(dH*60+dM)-(now.getHours()*60+now.getMinutes());
    var cls=remainMin>120?'safe':remainMin>0?'warn':'danger';
    if(dc)dc.className='descend-card '+cls;
    if(dctime){dctime.className='dc-time '+cls;dctime.textContent=dH+':'+String(dM).padStart(2,'0');}
    if(dctitle&&cls==='danger')dctitle.textContent=L({KO:'⚠️ 즉시 하산 권장!',EN:'⚠️ Descend now!',JP:'⚠️ 即時下山！',CN:'⚠️ 立即下山！'});
  });
}
function setMode(el){
  document.querySelectorAll('.mode-card').forEach(function(c){c.classList.remove('on');});
  el.classList.add('on');
  var mode=el.dataset.mode;
  _currentMode=mode;_currentPlayUrl=SC_PLAYLISTS[mode]?SC_PLAYLISTS[mode].default:null;
  _userOverride=true;
  var sv2=g('sound-view');if(sv2&&sv2.classList.contains('on'))renderSound();
}

/* ═══ 매장 리스트 (지도탭 하단) ═══ */
var _listFilter='all';
function renderMapList(){
  var L=function(o){return o[lang]||o.KO;};

  // 지도탭에서는 지도만 사용
}

/* ═══ 컬렉션 ═══ */
function renderGoods(){
  var el=g('goods-inner');if(!el)return;
  var state=getGS();
  var L=function(o){return o[lang]||o.KO;};
  var expData=getExpData();
  var exp=expData.exp||0;
  var lvInfo=getLevelInfo(exp);
  var nextLv=LEVELS[lvInfo.lv]||null;
  var expPct=nextLv?Math.min(((exp-lvInfo.min)/(nextLv.min-lvInfo.min))*100,100):100;
  var ptData=getPoints();
  var totalPt=ptData.total||0;

  var GOODS_LIST=[
    {key:'keyring',icon:'🗝️',nm:{KO:'식당 키링',EN:'Restaurant Keyring',JP:'食堂キーリング',CN:'餐厅钥匙扣'},cost:200,cat:'food'},
    {key:'tumbler',icon:'🥤',nm:{KO:'카페 텀블러',EN:'Café Tumbler',JP:'カフェタンブラー',CN:'咖啡杯'},cost:300,cat:'cafe'},
    {key:'sock',  icon:'🧦',nm:{KO:'고기 양말',EN:'BBQ Socks',JP:'焼肉ソックス',CN:'烤肉袜'},cost:200,cat:'gogi'},
    {key:'bandana',icon:'🪢',nm:{KO:'바 반다나',EN:'Bar Bandana',JP:'バーバンダナ',CN:'酒吧头巾'},cost:300,cat:'bar'},
    {key:'cap',   icon:'🧢',nm:{KO:'수락 캡',EN:'Surak Cap',JP:'スラクキャップ',CN:'水落帽'},cost:500,cat:'all'},
  ];
  var collected=GOODS_LIST.filter(function(g){return !!state[g.key];}).length;

  var h='';

  /* ── 현재 레벨 + 포인트 미니 카드 ── */
  var medalSrc=makeMedalSVG(lvInfo.lv,40);
  h+='<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r3);padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;box-shadow:var(--s1);">';
  h+='<img src="'+medalSrc+'" width="40" height="40" alt="medal"/>';
  h+='<div style="flex:1;">';
  h+='<div style="font-size:11px;color:var(--t3);">LV.'+lvInfo.lv+' '+L(lvInfo.name)+'</div>';
  h+='<div style="height:4px;background:var(--bd);border-radius:2px;margin:4px 0;">';
  h+='<div style="height:100%;width:'+expPct+'%;background:var(--ac);border-radius:2px;"></div></div>';
  h+='<div style="font-size:11px;color:var(--t3);">'+exp.toLocaleString()+' EXP</div></div>';
  h+='<div style="text-align:right;"><div style="font-size:18px;font-weight:800;color:var(--am);">'+totalPt.toLocaleString()+'</div><div style="font-size:10px;color:var(--t3);">POINT</div></div></div>';

  /* ── 수집 현황 ── */
  h+='<div class="prog-box">';
  h+='<div class="prog-hd"><div class="prog-lbl">🎒 '+T('tgoods')+'</div><div class="prog-cnt">'+collected+'/5</div></div>';
  h+='<div class="prog-track"><div class="prog-fill" style="width:'+(collected/5*100)+'%"></div></div>';
  h+='<div style="font-size:11px;color:var(--t3);margin-top:5px;">'+(collected===5?T('goodsAllDone'):T('goodsKeep'))+'</div></div>';

  /* ── 받는 방법 ── */
  h+='<div class="stit">'+L({KO:'굿즈 받는 방법',EN:'HOW TO GET GOODS',JP:'グッズの受取方法',CN:'如何获取周边'})+'</div>';
  h+='<div class="card">';
  [{n:1,ic:'🏪',t:{KO:'매장 방문',EN:'Visit Store',JP:'店舗訪問',CN:'到店'},d:{KO:'수락디자인거리 해당 카테고리 매장 방문',EN:'Visit the matching category store on Surak Design Street',JP:'スラクデザイン通りの該当カテゴリ店舗を訪問',CN:'访问水落设计街对应类别门店'}},
   {n:2,ic:'📸',t:{KO:'SNS 인증',EN:'SNS Verification',JP:'SNS認証',CN:'SNS认证'},d:{KO:'#수락디자인거리 해시태그로 SNS 업로드',EN:'Upload to SNS with #surakdesignstreet',JP:'#スラクデザイン通りタグでSNSにアップ',CN:'用#水落设计街标签上传SNS'}},
   {n:3,ic:'🎁',t:{KO:'결제 시 인증',EN:'Show at Checkout',JP:'会計時に提示',CN:'结账时出示'},d:{KO:'결제 시 SNS 인증 화면 제시 → 굿즈 수령',EN:'Show SNS proof at checkout → receive goods',JP:'会計時にSNS証明を提示 → グッズ受取',CN:'结账时出示SNS证明 → 领取周边'}}
  ].forEach(function(s){
    h+='<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--bd2);">';
    h+='<div style="width:26px;height:26px;border-radius:50%;background:var(--ac);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+s.n+'</div>';
    h+='<div><div style="font-size:13px;font-weight:700;color:var(--t1);">'+s.ic+' '+L(s.t)+'</div>';
    h+='<div style="font-size:11px;color:var(--t3);margin-top:2px;">'+L(s.d)+'</div></div></div>';
  });
  h+='</div>';

  /* ── EXP 적립 방법 ── */
  h+='<div class="stit">'+L({KO:'EXP 적립 방법',EN:'HOW TO EARN EXP',JP:'EXP積立方法',CN:'EXP获取方式'})+'</div>';
  h+='<div class="card">';
  [{ic:'🏪',t:{KO:'매장 방문',EN:'Store Visit',JP:'店舗訪問',CN:'到店'},p:'+50 EXP'},
   {ic:'🎒',t:{KO:'굿즈 수집',EN:'Goods Collect',JP:'グッズ収集',CN:'收集周边'},p:'+100 EXP'},
   {ic:'⛰️',t:{KO:'등산 완주',EN:'Hike Complete',JP:'登山完了',CN:'登山完成'},p:'+300 EXP'},
   {ic:'📸',t:{KO:'SNS 인증',EN:'SNS Share',JP:'SNS認証',CN:'SNS认证'},p:'+30 EXP'},
   {ic:'📅',t:{KO:'데일리 체크인',EN:'Daily Check-in',JP:'デイリーチェックイン',CN:'每日签到'},p:'+20 EXP'},
  ].forEach(function(row){
    h+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bd2);">';
    h+='<span style="font-size:18px;">'+row.ic+'</span>';
    h+='<span style="font-size:13px;font-weight:600;color:var(--t1);flex:1;">'+L(row.t)+'</span>';
    h+='<span style="font-size:13px;font-weight:800;color:var(--am);">'+row.p+'</span></div>';
  });
  h+='</div>';

  /* ── 굿즈 컬렉션 ── */
  h+='<div class="stit">'+L({KO:'🎁 굿즈 컬렉션',EN:'🎁 GOODS COLLECTION',JP:'🎁 グッズコレクション',CN:'🎁 周边收集'})+'</div>';
  h+='<div class="goods-grid">';
  GOODS_LIST.forEach(function(gd){
    var isC=!!state[gd.key];var nm=gd.nm[lang]||gd.nm.KO;
    h+='<div class="g-card'+(isC?' done':'')+'" data-gk="'+gd.key+'">';
    h+='<div class="g-ic">'+gd.icon+'</div>';
    if(isC)h+='<div class="g-ck">✅</div>';
    h+='<div class="g-nm">'+nm+'</div>';
    h+='<div style="font-size:10px;color:var(--am);margin-top:3px;">'+gd.cost+'P</div>';
    h+='</div>';
  });
  h+='</div>';

  /* ── 굿즈 교환소 ── */
  h+='<div class="stit">'+L({KO:'🎰 굿즈 교환소',EN:'🎰 GOODS EXCHANGE',JP:'🎰 グッズ交換所',CN:'🎰 周边兑换'})+'</div>';
  h+='<div style="font-size:12px;color:var(--t2);margin-bottom:10px;">🪙 '+L({KO:'보유 포인트',EN:'My Points',JP:'保有ポイント',CN:'持有积分'})+': <b style="color:var(--am);">'+totalPt.toLocaleString()+'P</b></div>';
  GOODS_LIST.forEach(function(gd){
    var owned=!!state[gd.key];var canBuy=totalPt>=gd.cost&&!owned;
    h+='<div class="goods-exchange-card">';
    h+='<div class="ge-ic">'+gd.icon+'</div>';
    h+='<div style="flex:1;"><div class="ge-nm">'+(owned?'✅ ':'')+( gd.nm[lang]||gd.nm.KO)+'</div>';
    h+='<div class="ge-cost">'+gd.cost+'P '+L({KO:'필요',EN:'required',JP:'必要',CN:'所需'})+'</div></div>';
    h+='<button class="ge-btn" '+(canBuy?'':'disabled')+' data-key="'+gd.key+'" data-cost="'+gd.cost+'">'+(owned?L({KO:'보유중',EN:'Owned',JP:'保有中',CN:'已拥有'}):L({KO:'교환',EN:'Exchange',JP:'交換',CN:'兑换'}))+'</button>';
    h+='</div>';
  });


  /* ── 앰버서더 카드 ── */
  h+='<div class="cert-card" style="margin-top:14px;">';
  h+='<div class="cert-logo">🐿️</div>';
  h+='<div class="cert-title">'+T('ambTitle')+'</div>';
  h+='<div class="cert-sub">'+T('ambDesc')+'</div>';
  h+=(collected===5?'<button class="cert-btn" onclick="showCert()">'+T('ambViewCert')+'</button>':'<button class="cert-btn">'+collected+'/5 '+T('ambProgress')+'</button>');
  h+='</div>';

  el.innerHTML=h;
  el.querySelectorAll('[data-gk]').forEach(function(card){
    card.addEventListener('click',function(){toggleGoods(this.dataset.gk);renderGoods();});
  });
  el.querySelectorAll('.ge-btn:not([disabled])').forEach(function(btn){
    btn.addEventListener('click',function(){
      var key=this.dataset.key,cost=parseInt(this.dataset.cost);
      if(!usePoint(cost,L({KO:'굿즈 교환',EN:'Goods exchange',JP:'グッズ交換',CN:'兑换周边'}))){
        showGpsToast(L({KO:'포인트가 부족합니다.',EN:'Not enough points.',JP:'ポイント不足',CN:'积分不足'}));return;
      }
      var s=getGS();s[key]=true;setGS(s);
      addExp(50,{KO:'굿즈 교환',EN:'Goods exchange',JP:'グッズ交換',CN:'兑换周边'});
      showGpsToast(L({KO:'굿즈 교환 완료! 🎁',EN:'Goods exchanged! 🎁',JP:'グッズ交換完了！🎁',CN:'兑换周边成功！🎁'}));
      renderGoods();
    });
  });
}

/* ═══ 사운드 ═══ */
function renderSound(){
  var el=g('sound-inner');if(!el)return;
  var pl=SC_PLAYLISTS[_currentMode]||SC_PLAYLISTS.walk;
  var activeUrl=_currentPlayUrl||pl.default;
  var title=pl.title?pl.title[lang]||pl.title.KO:(pl.titleKO||'');
  var desc=pl.desc?pl.desc[lang]||pl.desc.KO:(pl.descKO||'');
  var mLbls={
    walk:{KO:'🚶 Walk',EN:'🚶 Walk',JP:'🚶 Walk',CN:'🚶 Walk'},
    active:{KO:'⚡ Active',EN:'⚡ Active',JP:'⚡ Active',CN:'⚡ Active'},
    relax:{KO:'☕ Relax',EN:'☕ Relax',JP:'☕ Relax',CN:'☕ Relax'}
  };
  var h='';
  h+='<div style="background:var(--acbg);border-radius:var(--r2);padding:10px 12px;margin-bottom:12px;">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
  h+='<span id="gps-dot" style="width:8px;height:8px;border-radius:50%;background:#bbb;flex-shrink:0;display:inline-block;"></span>';
  h+='<span id="gps-status-text" style="font-size:12px;color:var(--t2);flex:1;">'+T('gpsDetecting')+'</span>';
  h+='<button onclick="toggleGPS()" style="font-size:11px;padding:4px 10px;border-radius:var(--r2);border:1.5px solid var(--ac);background:'+(_gpsActive?'var(--ac)':'#fff')+';color:'+(_gpsActive?'#fff':'var(--ac)')+';cursor:pointer;font-weight:700;">'+(_gpsActive?T('gpsOff'):T('gpsOn'))+'</button>';
  h+='</div>';
  h+='<div style="display:flex;gap:5px;">';
  GPS_ZONES.forEach(function(z){
    h+='<button class="gps-test-btn" data-zone="'+z.id+'" style="flex:1;font-size:10px;padding:4px 3px;border-radius:var(--r1);border:1px solid var(--bd);background:#fff;color:var(--t2);cursor:pointer;">'+(z.label[lang]||z.label.KO).split(' ')[0]+' '+T('gpsTest')+'</button>';
  });
  h+='</div></div>';
  h+='<div style="display:flex;gap:6px;margin-bottom:14px;">';
  ['walk','active','relax'].forEach(function(m){
    var ml=(mLbls[m]&&mLbls[m][lang])||m;var isOn=m===_currentMode;var col=SC_PLAYLISTS[m].color;
    h+='<button data-mode="'+m+'" class="smode-btn" style="border-color:'+(isOn?col:'var(--bd)')+';background:'+(isOn?col:'#fff')+';color:'+(isOn?'#fff':'var(--t2)')+';">'+ml+'</button>';
  });
  h+='</div>';
  h+='<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">';
  h+='<div style="width:40px;height:40px;border-radius:var(--r2);background:'+pl.color+';flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;">♪</div>';
  h+='<div><div style="font-size:14px;font-weight:800;color:var(--t1);">'+title+'</div><div style="font-size:12px;color:var(--t2);margin-top:2px;">'+desc+'</div></div></div>';
  h+='<div class="card" style="margin-bottom:12px;">';
  h+='<div style="font-size:10px;color:var(--t3);letter-spacing:1px;margin-bottom:6px;">'+T('nowPlaying')+'</div>';
  h+='<div id="sc-track-title" style="font-size:13px;font-weight:700;color:var(--t1);margin-bottom:10px;min-height:18px;">'+(_curTrackTitle||'—')+'</div>';
  h+='<div id="sc-prog-bar" style="height:4px;background:var(--bd);border-radius:2px;margin-bottom:6px;cursor:pointer;">';
  h+='<div id="sc-prog-fill" style="height:100%;background:var(--ac);border-radius:2px;width:0%;transition:width .5s;"></div></div>';
  h+='<div style="display:flex;justify-content:space-between;"><span id="sc-time-cur" style="font-size:10px;color:var(--t3);font-family:monospace;">0:00</span></div></div>';
  h+='<div style="border-radius:var(--r3);overflow:hidden;margin-bottom:14px;box-shadow:var(--s2);">';
  h+='<iframe id="sc-widget" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url='+encodeURIComponent(activeUrl)+'&color=%232C4A1E&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe></div>';
  h+='<div style="text-align:center;padding:8px 0 14px;">';
  h+='<div id="surak-char-wrap" style="display:inline-block;">';
  h+='<img src="'+SURAK_IMG+'" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--bd);" alt="수락이"/>';
  h+='</div><div style="font-size:11px;color:var(--t3);margin-top:6px;">'+T('soundWith')+'</div></div>';
  h+='<div style="font-size:11px;font-weight:700;color:var(--t1);margin-bottom:8px;">'+T('soundPlaylists')+'</div>';
  pl.lists.forEach(function(p){
    var isA=p.url===activeUrl;
    h+='<div class="sc-pl-item" data-url="'+p.url+'" style="background:'+(isA?'var(--acbg)':'#fff')+';border:1.5px solid '+(isA?pl.color:'var(--bd)')+';border-radius:var(--r3);padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;cursor:pointer;">';
    h+='<div style="width:36px;height:36px;border-radius:var(--r2);background:'+(isA?pl.color:'var(--bg2)')+';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">'+p.icon+'</div>';
    h+='<div style="flex:1;"><div style="font-size:13px;font-weight:700;color:'+(isA?pl.color:'var(--t1)')+';">'+p.title+'</div><div style="font-size:11px;color:var(--t3);margin-top:2px;">'+p.sub+'</div></div>';
    h+=(isA?'<div style="font-size:11px;color:'+pl.color+';font-weight:700;">'+T('soundPlaying')+'</div>':'<div style="font-size:18px;color:var(--bd);">▶</div>');
    h+='</div>';
  });

  // 히든 트랙 섹션
  var expData2=getExpData();var curLv=getLevelInfo(expData2.exp||0).lv;
  h+='<div class="stit">'+{KO:'🔒 레벨 전용 히든 트랙',EN:'🔒 LEVEL HIDDEN TRACKS',JP:'🔒 レベル専用ヒドゥントラック',CN:'🔒 等级专属隐藏曲目'}[lang]+'</div>';
  HIDDEN_TRACKS.forEach(function(ht){
    var unlocked=curLv>=ht.minLv;
    h+='<div style="background:'+(unlocked?'var(--sf)':'var(--bg2)')+';border:1.5px solid '+(unlocked?'var(--am)':'var(--bd)')+';border-radius:var(--r3);padding:12px 14px;margin-bottom:8px;opacity:'+(unlocked?'1':'.6')+';cursor:'+(unlocked?'pointer':'default')+'" class="'+(unlocked?'sc-hidden-item':'')+'" data-url="'+(unlocked?ht.url:'')+'">';
    h+='<div style="display:flex;align-items:center;gap:10px;">';
    h+='<div style="width:36px;height:36px;border-radius:var(--r2);background:'+(unlocked?'var(--ambg)':'var(--bg2)')+';display:flex;align-items:center;justify-content:center;font-size:18px;">'+ht.icon+'</div>';
    h+='<div style="flex:1;"><div style="font-size:13px;font-weight:800;color:'+(unlocked?'var(--am)':'var(--t3)')+';">'+ht.title+'</div>';
    h+='<div style="font-size:11px;color:var(--t3);margin-top:2px;">'+ht.sub+'</div>';
    h+='<div style="font-size:11px;margin-top:3px;color:'+(unlocked?'var(--ac2)':'var(--re)')+';">'+(unlocked?(ht.desc[lang]||ht.desc.KO):(ht.hint[lang]||ht.hint.KO))+'</div></div>';
    h+=(unlocked?'<div style="font-size:18px;color:var(--am);">▶</div>':'<div style="font-size:16px;">🔐</div>');
    h+='</div></div>';
  });
  el.innerHTML=h;
  setTimeout(initScWidget,500);
  el.querySelectorAll('.gps-test-btn').forEach(function(btn){btn.addEventListener('click',function(){testGpsZone(this.dataset.zone);});});
  el.querySelectorAll('.smode-btn').forEach(function(btn){btn.addEventListener('click',function(){_currentMode=this.dataset.mode;_currentPlayUrl=SC_PLAYLISTS[_currentMode]?SC_PLAYLISTS[_currentMode].default:null;_userOverride=true;renderSound();});});
  el.querySelectorAll('.sc-hidden-item').forEach(function(item){
    item.addEventListener('click',function(){
      var url=this.dataset.url;if(!url)return;
      _currentPlayUrl=url;_scReady=false;_scWidget=null;
      var iframe=g('sc-widget');
      if(iframe){iframe.src='https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&color=%232C4A1E&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false';setTimeout(initScWidget,800);}
    });
  });
  el.querySelectorAll('.sc-pl-item').forEach(function(item){
    item.addEventListener('click',function(){
      var url=this.dataset.url;_currentPlayUrl=url;_scReady=false;_scWidget=null;
      var iframe=g('sc-widget');
      if(iframe){iframe.src='https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&color=%232C4A1E&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false';setTimeout(initScWidget,800);}
    });
  });
  var pb2=g('sc-prog-bar');
  if(pb2)pb2.addEventListener('click',function(e){if(!_scWidget||!_scReady||!_curTrackDur)return;var rect=this.getBoundingClientRect();_scWidget.seekTo(Math.floor(((e.clientX-rect.left)/rect.width)*_curTrackDur));});
}

/* ═══ 마이 탭 ═══ */
function renderMy(){
  var el=g('my-inner');if(!el||el.dataset.done)return;
  el.dataset.done='1';
  var L=function(o){return o[lang]||o.KO;};
  var expData=getExpData();
  var exp=expData.exp||0;
  var lvInfo=getLevelInfo(exp);
  var gsData=getGS();
  var collected=GOODS_KEYS.filter(function(k){return !!gsData[k];}).length;
  var ptData=getPoints();
  var totalPt=ptData.total||0;
  var medalSrc=makeMedalSVG(lvInfo.lv,56);

  // 데일리 체크인
  var today=new Date().toDateString();
  var lastCheckin=localStorage.getItem('surak_checkin')||'';
  var canCheckin=lastCheckin!==today;

  var h='';
  var currentUser=getUserData();

  /* ── 히어로 ── */
  h+='<div class="my-hero">';
  h+='<div style="position:absolute;right:-10px;top:-10px;font-size:80px;opacity:.1;">'+lvInfo.badge+'</div>';
  h+='<div style="display:flex;align-items:center;gap:14px;position:relative;">';
  h+='<img src="'+SURAK_IMG+'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.4);" alt="수락이"/>';
  h+='<div style="flex:1;">';
  h+='<div style="font-size:11px;opacity:.65;letter-spacing:1px;">LV.'+lvInfo.lv+' · '+L(lvInfo.medal)+'</div>';
  h+='<div style="font-size:22px;font-weight:800;margin-bottom:2px;">'+L(lvInfo.name)+'</div>';
  h+='<div style="display:flex;align-items:center;gap:8px;">';
  h+='<img src="'+medalSrc+'" width="28" height="28" alt="medal"/>';
  h+='<div style="font-size:12px;opacity:.8;">'+exp.toLocaleString()+' EXP</div>';
  h+='</div></div></div>';
  // EXP 바
  var nextLv=LEVELS[lvInfo.lv]||null;
  var pct=nextLv?Math.min(((exp-lvInfo.min)/(nextLv.min-lvInfo.min))*100,100):100;
  h+='<div style="margin-top:12px;position:relative;">';
  h+='<div style="display:flex;justify-content:space-between;font-size:10px;opacity:.65;margin-bottom:4px;">';
  h+='<span>'+exp.toLocaleString()+' EXP</span><span>'+(nextLv?nextLv.min.toLocaleString()+' EXP':'MAX')+'</span></div>';
  h+='<div style="height:5px;background:rgba(255,255,255,.2);border-radius:3px;">';
  h+='<div style="height:100%;width:'+pct+'%;background:rgba(255,255,255,.85);border-radius:3px;transition:width .8s;"></div></div></div>';
  h+='</div>';
  if(currentUser){
    h+='<div style="margin:8px 0 0;position:relative;z-index:1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
    h+='<span style="font-size:12px;opacity:.8;">👤 '+currentUser.name+'</span>';
    h+='<button onclick="logout()" style="font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:#fff;cursor:pointer;">'+{KO:'로그아웃',EN:'Logout',JP:'ログアウト',CN:'退出登录'}[lang]+'</button>';
    h+='</div>';
  }

  /* ── 대시보드 ── */
  h+='<div style="margin:12px 14px 8px;">';
  // 데일리 체크인 버튼
  h+='<button id="checkin-btn" style="width:100%;padding:13px;border-radius:var(--r3);font-size:14px;font-weight:800;cursor:pointer;margin-bottom:12px;border:none;background:'+(canCheckin?'var(--ac)':'var(--bg2)')+';color:'+(canCheckin?'#fff':'var(--t3)');
  h+=';box-shadow:'+(canCheckin?'var(--s2)':'none')+';" '+(canCheckin?'':'disabled')+'>';
  h+=(canCheckin?'📅 '+L({KO:'데일리 체크인 (+20 EXP)',EN:'Daily Check-in (+20 EXP)',JP:'デイリーチェックイン (+20 EXP)',CN:'每日签到 (+20 EXP)'})
    :'✅ '+L({KO:'오늘 체크인 완료!',EN:'Checked in today!',JP:'今日チェックイン済み！',CN:'今日已签到！'}));
  h+='</button>';

  // 통계 그리드
  var stats=[
    {ic:'⛰️',num:expData.history?expData.history.filter(function(r){return typeof r.reason==='string'&&r.reason.indexOf('등산')>=0;}).length:0,
     lbl:{KO:'등산 횟수',EN:'Hikes',JP:'登山回数',CN:'登山次数'}},
    {ic:'🏪',num:GOODS_KEYS.filter(function(k){return !!gsData[k];}).length,
     lbl:{KO:'수집 굿즈',EN:'Goods',JP:'収集グッズ',CN:'收集周边'}},
    {ic:'🪙',num:totalPt,
     lbl:{KO:'보유 포인트',EN:'Points',JP:'保有ポイント',CN:'持有积分'}},
    {ic:'📅',num:(expData.history||[]).length,
     lbl:{KO:'총 활동',EN:'Activities',JP:'総活動',CN:'总活动'}},
  ];
  h+='<div class="dash-grid">';
  stats.forEach(function(s){
    h+='<div class="dash-card"><div class="dash-ic">'+s.ic+'</div>';
    h+='<div class="dash-num">'+s.num.toLocaleString()+'</div>';
    h+='<div class="dash-lbl">'+L(s.lbl)+'</div></div>';
  });
  h+='</div>';

  /* EXP 내역 제거됨 */

  /* ── 배지 도감 ── */
  h+='<div class="stit">'+L({KO:'🏅 배지 도감',EN:'🏅 BADGE COLLECTION',JP:'🏅 バッジ図鑑',CN:'🏅 徽章图鉴'})+'</div>';
  h+='<div id="my-badge-wrap"></div>';

  /* ── 단골 도감 ── */
  h+='<div class="stit">'+L({KO:'🏪 단골 도감',EN:'🏪 STORE RECORDS',JP:'🏪 常連図鑑',CN:'🏪 老顾客图鉴'})+'</div>';
  h+='<div id="my-dokkam-wrap"></div>';

  /* ── 포인트 ── */
  h+='<div class="stit">🪙 '+L({KO:'게임 포인트',EN:'GAME POINTS',JP:'ゲームポイント',CN:'游戏积分'})+'</div>';
  var ptNow=getPoints();
  h+='<div class="point-hero">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;">';
  h+='<div><div style="font-size:11px;opacity:.75;letter-spacing:1px;margin-bottom:4px;">'+L({KO:'보유 포인트',EN:'POINTS',JP:'保有ポイント',CN:'持有积分'})+'</div>';
  h+='<div><span class="point-num">'+(ptNow.total||0).toLocaleString()+'</span><span class="point-unit">P</span></div></div>';
  h+='<button onclick="openCouponPage()" style="background:#fff;color:var(--ac);border:none;border-radius:var(--r2);padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;">🎟️ '+L({KO:'쿠폰 교환',EN:'Get Coupon',JP:'クーポン交換',CN:'兑换优惠券'})+'</button>';
  h+='</div></div>';

  /* ── 쿠폰함 ── */
  h+='<div class="stit">🎟️ '+L({KO:'보유 쿠폰',EN:'MY COUPONS',JP:'保有クーポン',CN:'我的优惠券'})+'</div>';
  h+='<div id="my-coupon-wrap"></div>';

  /* ── 메뉴 ── */
  h+='<div class="stit">'+L({KO:'설정',EN:'SETTINGS',JP:'設定',CN:'设置'})+'</div>';
  var menus=[
    {ic:'🎒',t:L({KO:'컬렉션 현황',EN:'My Collection',JP:'コレクション状況',CN:'收藏状况'}),fn:"sv('goods')"},
    {ic:'🎵',t:L({KO:'음악 취향 설정',EN:'Music Preferences',JP:'音楽設定',CN:'音乐设置'}),fn:"sv('sound')"},
    {ic:'📢',t:L({KO:'공지사항',EN:'Notices',JP:'お知らせ',CN:'公告'}),fn:"alert('Notice')"},
    {ic:'⚙️',t:L({KO:'설정',EN:'Settings',JP:'設定',CN:'设置'}),fn:"alert('Settings')"},
  ];
  h+='<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r3);overflow:hidden;box-shadow:var(--s1);">';
  menus.forEach(function(m){
    h+='<div class="my-menu-row" onclick="'+m.fn+'"><div class="my-menu-ic">'+m.ic+'</div><div class="my-menu-t">'+m.t+'</div><div class="my-menu-ar">›</div></div>';
  });
  h+='</div>';

  /* ── 로그인 ── */
  h+='<div style="margin:12px 0;padding:16px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--r3);text-align:center;box-shadow:var(--s1);">';
  h+='<div style="font-size:14px;font-weight:700;color:var(--t1);margin-bottom:6px;">🔐 '+L({KO:'간편 로그인',EN:'Quick Login',JP:'簡単ログイン',CN:'快捷登录'})+'</div>';
  h+='<div style="font-size:12px;color:var(--t3);margin-bottom:14px;line-height:1.7;">'+L({KO:'로그인하면 컬렉션이 저장되고 기기가 바뀌어도 유지됩니다.',EN:'Login to save your collection across all devices.',JP:'ログインでコレクションを保存、機器変更後も維持されます。',CN:'登录后收藏跨设备保存。'})+'</div>';
  h+='<div style="display:flex;flex-direction:column;gap:8px;">';
  h+='<button class="login-btn login-kakao" id="btn-kakao">'+L({KO:'💛 카카오로 로그인',EN:'💛 Login with Kakao',JP:'💛 カカオでログイン',CN:'💛 Kakao登录'})+'</button>';
  h+='<button class="login-btn login-naver" id="btn-naver">'+L({KO:'🟢 네이버로 로그인',EN:'🟢 Login with Naver',JP:'🟢 ネイバーでログイン',CN:'🟢 Naver登录'})+'</button>';
  h+='<button class="login-btn login-google" id="btn-google">'+L({KO:'🔵 구글로 로그인',EN:'🔵 Login with Google',JP:'🔵 Googleでログイン',CN:'🔵 Google登录'})+'</button>';
  h+='</div></div>';
  h+='</div>';

  el.innerHTML=h;

  // 배지/단골 도감 렌더
  renderBadgeSection(document.getElementById('my-badge-wrap'));
  renderDokkamSection(document.getElementById('my-dokkam-wrap'));
  // 쿠폰 렌더
  renderMyCoupons(document.getElementById('my-coupon-wrap'));

  // 체크인 버튼
  var cb=g('checkin-btn');
  if(cb&&canCheckin){
    cb.addEventListener('click',function(){
      localStorage.setItem('surak_checkin',today);
      addExp(EXP_EVENTS.daily_checkin,{KO:'데일리 체크인',EN:'Daily check-in',JP:'デイリーチェックイン',CN:'每日签到'});
      showGpsToast('+20 EXP 📅');
      var mi=g('my-inner');if(mi)delete mi.dataset.done;
      renderMy();
    });
  }
}

function showCert(){alert('수락스트릿 앰버서더 인증서');}
/* ═══ 천상병 배너 ═══ */
function initCheonBanner(){
  var ticker=g('cheon-ticker');if(!ticker)return;
  var text=CHEON_POEMS.map(function(p){
    var txt=lang==='EN'?p.en:lang==='JP'?p.jp:lang==='CN'?p.cn:p.ko;
    return '✨ '+txt+' — '+p.src+'　　　';
  }).join('');
  ticker.textContent=text+text;
}

/* ═══ 가이드 ═══ */
var GUIDE_TIPS=[
  '🌅 일출 1시간 전부터 입산을 권장합니다.',
  '🔥 산불 예방을 위해 화기 사용을 금지합니다.',
  '💧 수락산에는 아름다운 폭포와 계곡이 있습니다!',
  '🎒 수락디자인거리에서 굿즈를 수령하세요!',
  '⛰️ 안전한 등산을 위해 등산화를 착용하세요.'
];
var _guideIdx=0;
function showGuideTip(){
  var TIPS={
    KO:[
      '⛰️ 수락산은 해발 638m! 기차바위에서 서울 전경이 한눈에 보여요.',
      '💧 은류폭포는 벽운계곡 코스 중간에 있어요. 여름엔 꼭 들러보세요!',
      '🖊️ 천상병 시인은 수락산 인근에 살며 "귀천"을 썼어요. 오늘도 소풍 온 것처럼 즐겨요!',
      '🎒 식사·카페·고기·포차 4가지 카테고리 방문하면 굿즈 4종 수령!',
      '✨ 매일 저녁 8시부터 8시 30분, 빛의 런웨이가 펼쳐져요!',
      '🥾 등산 전 오공김밥에서 든든하게 드시고 출발하세요!',
      '🌸 봄엔 벚꽃, 여름엔 계곡, 가을엔 단풍, 겨울엔 설경! 사계절 모두 예뻐요.',
      '🍺 등산 후 수락산 막걸리 한 잔은 필수코스! 포차거리로 오세요.',
      '📸 #수락디자인거리 해시태그로 SNS 인증하면 굿즈 받을 수 있어요!',
      '🚇 4호선 수락산역 3번출구로 나오면 바로 수락 스트릿이에요!',
      '⚠️ 산불 예방을 위해 화기 사용은 절대 금지예요!',
      '🌊 벽운계곡 코스는 3.5km, 2시간이면 충분해요. 초보자도 도전 가능!',
      '🏆 5개 카테고리 모두 방문하면 수락스트릿 앰버서더가 돼요!',
      '☕ 수락 스트릿에는 개성 넘치는 카페가 7곳이나 있어요. 다 가봐요!',
      '🎵 오늘 기분에 맞는 사운드 탭 음악과 함께 산책해보세요!'
    ],
    EN:[
      '⛰️ Suraksan is 638m high! See all of Seoul from Gichabawi Rock.',
      '💧 Eunryu Falls is mid-way on the Byeokun Valley route. A must-visit in summer!',
      '🖊️ Poet Cheon Sang-byeong wrote "Returning to Heaven" near Suraksan.',
      '🎒 Visit all 4 categories to collect 4 types of goods!',
      '✨ Light Runway show every evening 8:00~8:30PM!',
      '🥾 Fuel up at a gimbap shop before your hike!',
      '🌸 Cherry blossoms, cool valleys, autumn leaves, snow - beautiful all year!',
      '🍺 Post-hike makgeolli at the pojangmacha street is a must!',
      '📸 Tag #surakdesignstreet on SNS to claim your goods!',
      '🚇 Exit 3 of Suraksan Station leads directly to Surak Street!'
    ],
    JP:[
      '⛰️ 水落山は638m！汽車岩からソウル全景が一望できます。',
      '💧 銀流瀑布は碧雲渓谷コースの途中にあります。夏は必見！',
      '🖊️ 詩人千尚炳は水落山近くに住み「帰天」を書きました。',
      '🎒 4つのカテゴリを訪問すればグッズ4種ゲット！',
      '✨ 毎晩20:00~20:30、光のランウェイが開催されます！',
      '🥾 登山前にキムパプ店で腹ごしらえ！',
      '🌸 春の桜、夏の渓谷、秋の紅葉、冬の雪景色、四季どれも美しい！',
      '📸 #スラクデザイン通りでSNS認証すればグッズがもらえます！',
      '🚇 4号線スラクサン駅3番出口からスラクストリートへすぐ！'
    ],
    CN:[
      '⛰️ 水落山海拔638m！从火车岩可以俯瞰首尔全景。',
      '💧 银流瀑布在碧云溪谷路线中段，夏天必去！',
      '🖊️ 诗人千尚炳在水落山附近生活，写下了《归天》。',
      '🎒 访问4个类别即可领取4种周边！',
      '✨ 每晚20:00~20:30举办光之跑道活动！',
      '🥾 登山前在紫菜包饭店吃饱再出发！',
      '🌸 春樱、夏溪、秋叶、冬雪，四季皆美！',
      '📸 在SNS上标记#水落设计街即可领取周边！',
      '🚇 4号线水落山站3号出口直通水落街！'
    ]
  };
  var bubble=g('guide-bubble'),text=g('guide-text');if(!bubble||!text)return;
  var tips=TIPS[lang]||TIPS.KO;
  text.textContent=tips[_guideIdx%tips.length];_guideIdx++;
  bubble.style.display='block';
  setTimeout(function(){if(bubble)bubble.style.display='none';},6000);
}

/* ═══ 번역 ═══ */

var _mapPanelOpen = true;
function toggleMapPanel(){
  var panel = g('map-list-panel');
  if(!panel) return;
  _mapPanelOpen = !_mapPanelOpen;
  if(_mapPanelOpen){ panel.classList.remove('collapsed'); }
  else { panel.classList.add('collapsed'); }
}

function renderMapList(){
  var L=function(o){return o[lang]||o.KO;};
  var el = g('map-list-inner');
  if(!el) return;
  var catColors={food:'#4A7A35',gogi:'#8B3A2A',cafe:'#2A558B',bar:'#6B3A8B',outdoor:'#6B6B2A'};
  var filtered = _curFilter==='all' ? STORES : STORES.filter(function(s){return s.cat===_curFilter;});
  var h='';
  filtered.forEach(function(s){
    var nm = lang==='EN'?s.en:lang==='JP'?s.jp:lang==='CN'?s.cn:s.ko;
    h+='<div class="map-sc" data-sid="'+s.id+'">'
      +'<div class="map-sc-dot" style="background:'+(catColors[s.cat]||'#2C4A1E')+'"></div>'
      +'<div><div class="map-sc-nm">'+nm+'</div><div class="map-sc-meta">'+s.addr+'</div></div>'
      +'<div class="map-sc-dist">'+s.dist+'m</div>'
      +'</div>';
  });
  el.innerHTML = h;
  el.querySelectorAll('.map-sc').forEach(function(row){
    row.addEventListener('click', function(){
      var sid = parseInt(this.dataset.sid);
      var store = STORES.find(function(s){return s.id===sid;});
      if(store) openPopup(store);
    });
  });
  // 라벨 업데이트
  var lbl = g('map-list-label');
  if(lbl) lbl.textContent = '📋 '+L({KO:'매장 목록',EN:'Stores',JP:'店舗一覧',CN:'店铺列表'})+' ('+filtered.length+L({KO:'개',EN:'',JP:'件',CN:'家'})+')';
}

/* ═══ 포인트 시스템 ═══ */
function getPoints(){
  try{return JSON.parse(localStorage.getItem('surak_points')||'{"total":0,"history":[]}');}
  catch(e){return {total:0,history:[]};}
}
function addPoint(amount,reason,icon){
  var data=getPoints();
  data.total=Math.max(0,(data.total||0)+amount);
  data.history=data.history||[];
  data.history.unshift({amount:amount,reason:reason,icon:icon||'🎯',date:new Date().toLocaleDateString('ko-KR')});
  if(data.history.length>20)data.history=data.history.slice(0,20);
  try{localStorage.setItem('surak_points',JSON.stringify(data));}catch(e){}
  return data.total;
}
function usePoint(amount,reason){
  var data=getPoints();
  if(data.total<amount)return false;
  addPoint(-amount,reason,'💸');
  return true;
}

/* ═══ 내 위치 ═══ */
var _myMarker=null;
function moveToMyLocation(){
  if(!navigator.geolocation){alert('GPS를 지원하지 않는 브라우저입니다.');return;}
  var btn=g('my-loc-btn');
  if(btn)btn.classList.add('locating');
  navigator.geolocation.getCurrentPosition(
    function(pos){
      var lat=pos.coords.latitude,lng=pos.coords.longitude;
      if(btn)btn.classList.remove('locating');
      if(!_map)return;
      // 기존 내 위치 마커 제거
      if(_myMarker)_myMarker.setMap(null);
      // 파란 점 마커
      var markerHtml='<div style="position:relative;width:20px;height:20px;">'
        +'<div style="position:absolute;inset:0;border-radius:50%;background:#4A90E2;border:3px solid #fff;box-shadow:0 2px 8px rgba(74,144,226,.6);z-index:2;"></div>'
        +'<div style="position:absolute;top:-6px;left:-6px;width:32px;height:32px;border-radius:50%;background:rgba(74,144,226,.2);animation:myLocPulse 1.5s ease-out infinite;"></div>'
        +'</div>';
      _myMarker=new naver.maps.Marker({
        position:new naver.maps.LatLng(lat,lng),
        map:_map,
        icon:{content:markerHtml,anchor:new naver.maps.Point(10,10)},
        zIndex:200
      });
      _map.panTo(new naver.maps.LatLng(lat,lng));
      _map.setZoom(17);
      showGpsToast({KO:'내 위치로 이동했습니다 📍',EN:'Moved to your location 📍',JP:'現在地に移動しました 📍',CN:'已移动到您的位置 📍'}[lang]||'내 위치로 이동했습니다 📍');
    },
    function(err){
      if(btn)btn.classList.remove('locating');
      var msgs={1:{KO:'위치 권한을 허용해주세요.',EN:'Please allow location access.',JP:'位置情報を許可してください。',CN:'请允许位置访问。'},
                2:{KO:'위치를 찾을 수 없습니다.',EN:'Location unavailable.',JP:'位置を取得できません。',CN:'无法获取位置。'},
                3:{KO:'위치 요청 시간이 초과됐습니다.',EN:'Location request timed out.',JP:'位置リクエストがタイムアウトしました。',CN:'位置请求超时。'}};
      var msg=(msgs[err.code]&&msgs[err.code][lang])||'위치를 가져올 수 없습니다.';
      showGpsToast(msg);
    },
    {enableHighAccuracy:true,timeout:10000,maximumAge:0}
  );
}

function renderInfo(){
  var el=g('info-inner');if(!el||el.dataset.done)return;
  el.dataset.done='1';
  var L=function(o){return o[lang]||o.KO;};
  var h='';

  /* ── 수락산 히어로 ── */
  h+='<div class="course-hero">';
  h+='<div style="font-size:11px;opacity:.65;letter-spacing:1px;margin-bottom:5px;">SURAKSAN · 수락산</div>';
  h+='<div style="font-size:22px;font-weight:800;margin-bottom:4px;">'+T('infoSurakMt')+'</div>';
  h+='<div style="font-size:12px;opacity:.8;">'+T('infoMtDesc')+'</div>';
  h+='<div class="course-stat-row">';
  ['⛰️ 637m','🥾 8.2km','⏱ 4h','🌊 은류폭포','🪨 기차바위'].forEach(function(t){h+='<span class="course-stat">'+t+'</span>';});
  h+='</div></div>';

  /* ── 안전 위젯 ── */
  h+='<div class="safety-widget">';
  h+='<div style="font-size:13px;font-weight:800;">⛑️ '+L({KO:'안전 가이드',EN:'Safety Guide',JP:'安全ガイド',CN:'安全指南'})+'</div>';
  h+='<div class="safety-row">';
  h+='<div class="safety-item"><div class="safety-ic" id="sw-ico">🌤️</div><div class="safety-lbl">'+L({KO:'날씨',EN:'Weather',JP:'天気',CN:'天气'})+'</div><div class="safety-val" id="sw-temp">--°C</div></div>';
  h+='<div class="safety-item"><div class="safety-ic">💨</div><div class="safety-lbl">'+L({KO:'풍속',EN:'Wind',JP:'風速',CN:'风速'})+'</div><div class="safety-val" id="sw-wind">--m/s</div></div>';
  h+='<div class="safety-item"><div class="safety-ic">🕐</div><div class="safety-lbl">'+L({KO:'하산권장',EN:'Descend by',JP:'下山推奨',CN:'建议下山'})+'</div><div class="safety-val" id="sw-descend">--:--</div></div>';
  h+='</div>';
  h+='<div class="descend-alert safe" id="sw-alert"><span style="font-size:18px;">⏳</span><span style="font-size:12px;font-weight:600;">'+L({KO:'날씨 정보 불러오는 중...',EN:'Loading weather...',JP:'気象情報取得中...',CN:'加载天气信息...'})+'</span></div>';
  h+='</div>';

  /* ── 고도 그래프 ── */
  var lms=TRAILS[0].landmarks||[];
  h+='<div class="elev-wrap">';
  h+='<div class="elev-title">📈 '+L({KO:'고도 프로파일',EN:'Elevation Profile',JP:'高度プロファイル',CN:'高度剖面'})+'</div>';
  var W=280,H=70,pad=10,maxE=637,minE=50;
  var pts=lms.map(function(l){
    return {x:Math.round(pad+(W-pad*2)*(l.time/110)),y:Math.round(H-pad-(H-pad*2)*((l.elev-minE)/(maxE-minE))),elev:l.elev};
  });
  var pathD=pts.map(function(p,i){return (i?'L':'M')+p.x+' '+p.y;}).join(' ');
  var fillD=pathD+' L'+pts[pts.length-1].x+' '+(H-pad)+' L'+pts[0].x+' '+(H-pad)+' Z';
  h+='<svg viewBox="0 0 '+W+' '+H+'" class="elev-svg">';
  h+='<defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2C4A1E" stop-opacity=".4"/><stop offset="100%" stop-color="#2C4A1E" stop-opacity=".05"/></linearGradient></defs>';
  [0,200,400,637].forEach(function(e){var y=Math.round(H-pad-(H-pad*2)*((e-minE)/(maxE-minE)));h+='<line x1="'+pad+'" y1="'+y+'" x2="'+(W-pad)+'" y2="'+y+'" stroke="#DDD5C4" stroke-width=".5"/><text x="'+pad+'" y="'+(y-2)+'" font-size="7" fill="#9A9080">'+e+'m</text>';});
  h+='<path d="'+fillD+'" fill="url(#eg)"/><path d="'+pathD+'" fill="none" stroke="#2C4A1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  pts.forEach(function(p){h+='<circle cx="'+p.x+'" cy="'+p.y+'" r="3" fill="#2C4A1E"/>';});
  h+='</svg></div>';

  /* ── 진행률 ── */
  h+='<div class="progress-track-wrap">';
  h+='<div style="font-size:11px;font-weight:700;color:var(--t3);letter-spacing:1px;font-family:monospace;">'+L({KO:'📍 등산 진행률',EN:'📍 HIKING PROGRESS',JP:'📍 登山進捗',CN:'📍 登山进度'})+'</div>';
  h+='<div style="font-size:11px;color:var(--t2);margin-top:4px;">'+L({KO:'GPS 위치 기반 실시간 추적',EN:'Real-time GPS tracking',JP:'GPSリアルタイム追跡',CN:'GPS实时位置追踪'})+'</div>';
  h+='<div class="progress-bar-outer"><div class="progress-bar-inner" id="hike-prog-bar" style="width:0%"></div><div class="progress-dot" id="hike-prog-dot" style="left:0%"></div></div>';
  h+='<div class="landmark-labels">';
  lms.forEach(function(l){h+='<div class="landmark-label">'+l.icon+'</div>';});
  h+='</div></div>';

  /* ── 랜드마크 스텝 ── */
  h+='<div style="font-size:10px;font-weight:700;color:var(--t3);letter-spacing:1.5px;text-transform:uppercase;margin:14px 0 8px;font-family:monospace;">'+T('infoHikingTitle')+' — '+L({KO:'주봉 코스 가이드',EN:'Summit Course Guide',JP:'主峰コースガイド',CN:'主峰路线指南'})+'</div>';
  h+='<div class="landmark-list">';
  lms.forEach(function(l,i){
    var nm=L(l.name),desc=L(l.desc),warn=l.warn?L(l.warn):null;
    h+='<div class="landmark-row" id="lm-'+i+'">';
    h+='<div class="landmark-dot-col"><div class="landmark-dot"></div>'+(i<lms.length-1?'<div style="flex:1;width:2px;background:var(--bd);margin-top:3px;"></div>':'')+'</div>';
    h+='<div class="landmark-body"><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:18px;">'+l.icon+'</span><div><div class="landmark-name">'+nm+'</div><div class="landmark-time">⏱ '+l.time+L({KO:'분',EN:'min',JP:'分',CN:'分'})+' · ↑'+l.elev+'m</div></div></div>';
    h+='<div class="landmark-desc">'+desc+'</div>';
    if(warn)h+='<div class="landmark-warn">'+warn+'</div>';
    h+='</div></div>';
  });
  h+='</div>';

  /* ── 수계 명소 ── */
  h+='<div style="font-size:10px;font-weight:700;color:var(--t3);letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 8px;font-family:monospace;">'+T('infoWaterTitle')+'</div>';
  [{icon:'💦',name:{KO:'은류폭포',EN:'Eunryu Falls',JP:'銀流瀑布',CN:'银流瀑布'},desc:{KO:'높이 15m. 여름철 최고 피서지',EN:'15m high. Best summer retreat.',JP:'高さ15m。夏の最高の避暑地。',CN:'高15m，夏季最佳避暑地。'},route:{KO:'벽운계곡 코스 30분',EN:'30min via Byeokun Valley',JP:'碧雲渓谷コース30分',CN:'碧云溪谷路线30分钟'}},
   {icon:'🏞️',name:{KO:'벽운계곡',EN:'Byeokun Valley',JP:'碧雲渓谷',CN:'碧云溪谷'},desc:{KO:'수락산 최고의 계곡. 맑은 물',EN:'Best valley. Crystal clear water.',JP:'最高の渓谷。澄んだ水。',CN:'最美溪谷，清澈的水。'},route:{KO:'수락산역 도보 20분',EN:'20min walk from station',JP:'駅から徒歩20分',CN:'车站步行20分钟'}}
  ].forEach(function(sp){
    h+='<div style="background:linear-gradient(135deg,#EBF4F9,#DCF0F9);border-radius:var(--r3);padding:12px 14px;margin-bottom:8px;border-left:3px solid var(--bl);box-shadow:var(--s1);">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="font-size:20px;">'+sp.icon+'</span><span style="font-size:14px;font-weight:800;color:var(--bl);">'+L(sp.name)+'</span></div>';
    h+='<div style="font-size:12px;color:var(--t2);line-height:1.6;margin-bottom:4px;">'+L(sp.desc)+'</div>';
    h+='<div style="font-size:11px;color:var(--bl);font-weight:700;">🚶 '+L(sp.route)+'</div></div>';
  });

  /* ── 빛의 런웨이 ── */
  h+='<div style="font-size:10px;font-weight:700;color:var(--t3);letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 8px;font-family:monospace;">'+T('infoLandmarkTitle')+'</div>';
  h+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:var(--r4);padding:20px;margin-bottom:10px;color:#fff;position:relative;overflow:hidden;">';
  h+='<div style="position:absolute;right:16px;bottom:-8px;font-size:64px;opacity:.1;">✨</div>';
  h+='<div style="font-size:19px;font-weight:800;margin-bottom:6px;">'+T('infoRunwayTitle')+'</div>';
  h+='<div style="font-size:12px;opacity:.8;margin-bottom:14px;line-height:1.7;">'+T('infoRunwayDesc')+'</div>';
  h+='<div style="background:rgba(255,255,255,.12);border-radius:var(--r2);padding:10px 14px;display:flex;align-items:center;gap:10px;"><span style="font-size:24px;">🕗</span><div><div style="font-size:10px;opacity:.6;margin-bottom:2px;">'+T('infoRunwayTime')+'</div><div style="font-size:18px;font-weight:800;">20:00 ~ 20:30</div></div></div></div>';

  /* ── 천상병 ── */
  h+='<div style="font-size:10px;font-weight:700;color:var(--t3);letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 8px;font-family:monospace;">'+T('infoCheonTitle')+'</div>';
  var poem=CHEON_POEMS[0];
  h+='<div style="background:linear-gradient(135deg,#1A1A2E,#16213E);border-radius:var(--r3);padding:18px;color:#fff;margin-bottom:10px;">';
  h+='"'+(lang==='EN'?poem.en:lang==='JP'?poem.jp:lang==='CN'?poem.cn:poem.ko)+'"';
  h+='<div style="font-size:10px;opacity:.5;margin-top:8px;text-align:right;">— '+poem.src+'</div></div>';

  /* ── 오시는 길 ── */
  h+='<div style="font-size:10px;font-weight:700;color:var(--t3);letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 8px;font-family:monospace;">'+T('infoAccessTitle')+'</div>';
  h+='<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r3);padding:14px;box-shadow:var(--s1);">';
  [{ic:'🚇',t:{KO:'지하철',EN:'Subway',JP:'地下鉄',CN:'地铁'},d:{KO:'7·4호선 수락산역 3번출구 → 도보 1분',EN:'Line 7·4 Suraksan Stn Exit 3 → 1min',JP:'7·4号線스라쿠산駅3番出口 → 徒歩1分',CN:'7·4号线水落山站3号出口 → 步行1分'}},
   {ic:'🚌',t:{KO:'버스',EN:'Bus',JP:'バス',CN:'公交'},d:{KO:'수락산역 정류장 하차',EN:'Suraksan Station bus stop',JP:'スラクサン駅バス停',CN:'水落山站公交站'}},
   {ic:'🚗',t:{KO:'자가용',EN:'Car',JP:'自家用車',CN:'自驾'},d:{KO:'노원구 동일로242길',EN:'Dongil-ro 242-gil, Nowon-gu',JP:'盧原区同一路242キル',CN:'芦原区同一路242街'}}
  ].forEach(function(item){
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span style="font-size:20px;">'+item.ic+'</span><div><div style="font-size:13px;font-weight:700;">'+L(item.t)+'</div><div style="font-size:11px;color:var(--t3);">'+L(item.d)+'</div></div></div>';
  });
  h+='</div>';
  el.innerHTML=h;

  // 날씨 로드
  fetchWeather(function(wd){
    if(!wd)return;
    var ico=g('sw-ico'),tmp=g('sw-temp'),wind=g('sw-wind'),desc=g('sw-descend'),alert=g('sw-alert');
    if(ico)ico.textContent=weatherIcon(wd.code);
    if(tmp)tmp.textContent=wd.temp+'°C';
    if(wind)wind.textContent=wd.wind+'m/s';
    var now=new Date(),dH=18,dM=30;
    if(desc)desc.textContent=dH+':'+String(dM).padStart(2,'0');
    var ok=hikingOk(wd.code,wd.temp)&&(now.getHours()<dH||(now.getHours()===dH&&now.getMinutes()<dM));
    if(alert){
      alert.className='descend-alert '+(ok?'safe':'warn');
      alert.innerHTML='<span style="font-size:18px;">'+(ok?'✅':'⚠️')+'</span><span style="font-size:12px;font-weight:600;color:'+(ok?'var(--ac)':'var(--re)')+';">'+L({KO:ok?'등산하기 좋은 날씨입니다!':'악천후 또는 하산 권장 시간입니다!',EN:ok?'Great weather for hiking!':'Caution! Bad weather or time to descend.',JP:ok?'登山に良い天気です！':'悪天候または下山推奨時間です！',CN:ok?'适合登山的好天气！':'恶劣天气或建议下山！'})+'</span>';
    }
  });
}

/* ═══════════════════════════════════════
   LEVEL / EXP / BADGE SYSTEM
═══════════════════════════════════════ */
var LEVELS=[
  {lv:1, name:{KO:'입산자',EN:'Newcomer',JP:'入山者',CN:'入山者'},
   min:0,max:500,cls:'lv1',badge:'🥉',
   desc:{KO:'수락산에 첫 발을 내딛었어요!',EN:'First steps on Suraksan!',JP:'水落山に初めて踏み込んだ！',CN:'踏上水落山的第一步！'},
   medal:{KO:'브론즈 훈장',EN:'Bronze Medal',JP:'ブロンズ勲章',CN:'铜质勋章'}},
  {lv:2, name:{KO:'길잡이',EN:'Pathfinder',JP:'道案内',CN:'向导'},
   min:500,max:1500,cls:'lv2',badge:'🥈',
   desc:{KO:'능선의 감각을 익혀가고 있어요!',EN:'Getting the feel of the ridgeline!',JP:'稜線の感覚を身につけている！',CN:'正在熟悉山脊的感觉！'},
   medal:{KO:'실버 훈장',EN:'Silver Medal',JP:'シルバー勲章',CN:'银质勋章'}},
  {lv:3, name:{KO:'숙련가',EN:'Expert',JP:'熟練者',CN:'熟练者'},
   min:1500,max:3000,cls:'lv3',badge:'🥇',
   desc:{KO:'정상석이 눈앞에! 단련된 산꾼이에요.',EN:'The summit is near! A seasoned hiker.',JP:'頂上石が目前！鍛えられた山人。',CN:'山顶石就在眼前！经验丰富的登山者。'},
   medal:{KO:'골드 훈장',EN:'Gold Medal',JP:'ゴールド勲章',CN:'金质勋章'}},
  {lv:4, name:{KO:'산악대장',EN:'Mountain Captain',JP:'山岳隊長',CN:'山岳队长'},
   min:3000,max:6000,cls:'lv4',badge:'💎',
   desc:{KO:'수락산 상권을 리드하는 베테랑!',EN:'Veteran leading Suraksan culture!',JP:'スラクサンをリードするベテラン！',CN:'引领水落山文化的老手！'},
   medal:{KO:'에메랄드 훈장',EN:'Emerald Medal',JP:'エメラルド勲章',CN:'翡翠勋章'}},
  {lv:5, name:{KO:'명예수호자',EN:'Guardian of Honor',JP:'名誉守護者',CN:'名誉守护者'},
   min:6000,max:999999,cls:'lv5',badge:'👑',
   desc:{KO:'수락 스트릿의 최고 동반자. 전설이에요.',EN:'Ultimate companion of Surak Street.',JP:'スラクストリートの最高の同伴者。',CN:'水落街的最高伴侣。'},
   medal:{KO:'크라운 훈장',EN:'Crown Medal',JP:'クラウン勲章',CN:'王冠勋章'}}
];

// EXP 적립 이벤트
var EXP_EVENTS={
  visit_store:50,    // 매장 방문
  goods_collect:100, // 굿즈 수집
  sns_share:30,      // SNS 공유
  hike_complete:300, // 등산 완주
  first_login:200,   // 첫 로그인
  daily_checkin:20,  // 데일리 체크인
};

function getExpData(){
  try{return JSON.parse(localStorage.getItem('surak_exp')||'{"exp":0,"lv":1,"history":[]}');}
  catch(e){return {exp:0,lv:1,history:[]};}
}
function saveExpData(d){
  try{localStorage.setItem('surak_exp',JSON.stringify(d));}catch(e){}
}
// 서버(Firestore users) → 로컬 캐시 동기화: 마이탭이 서버 포인트/XP/레벨을 반영
function fbSyncUser(cb){
  if(typeof FB==='undefined'||!FB.ready||!FB.user){if(cb)cb();return;}
  var uid=FB.user.uid;
  Promise.all([
    FB.db.collection('users').doc(uid).get(),
    FB.db.collection('stamps').where('userId','==',uid).get()
  ]).then(function(r){
    var s=r[0];
    if(s.exists){var d=s.data();
      try{var p=getPoints();p.total=d.points||0;localStorage.setItem('surak_points',JSON.stringify(p));}catch(e){}
      try{var ex=getExpData();ex.exp=d.xp||0;ex.lv=d.level||1;localStorage.setItem('surak_exp',JSON.stringify(ex));}catch(e){}
    }
    // 스탬프(매장별) → surak_store_visits 캐시(단골 도감/스탬프함이 서버값 표시)
    try{var svm={};r[1].forEach(function(doc){var x=doc.data();if(x.storeId!=null)svm[x.storeId]=x.count||0;});localStorage.setItem('surak_store_visits',JSON.stringify(svm));}catch(e){}
    var mv=g('my-view');if(mv&&mv.classList.contains('on')){var mi=g('my-inner');if(mi)delete mi.dataset.done;renderMy();}
    if(cb)cb();
  }).catch(function(e){console.warn('[FB] user sync 실패',e);if(cb)cb();});
}

function getLevelInfo(exp){
  for(var i=LEVELS.length-1;i>=0;i--){
    if(exp>=LEVELS[i].min)return LEVELS[i];
  }
  return LEVELS[0];
}

function addExp(amount,reason){
  if(reason&&typeof reason==='object')reason=reason[lang]||reason.KO||'';
  var d=getExpData();
  var oldLv=getLevelInfo(d.exp);
  d.exp=(d.exp||0)+amount;
  var newLv=getLevelInfo(d.exp);
  d.lv=newLv.lv;
  d.history=d.history||[];
  d.history.unshift({amount:amount,reason:reason,date:new Date().toLocaleDateString('ko-KR')});
  if(d.history.length>30)d.history=d.history.slice(0,30);
  saveExpData(d);
  // 포인트도 같이 적립
  addPoint(amount,reason,'⭐');
  // 레벨업 체크
  if(newLv.lv>oldLv.lv){
    showLevelUp(newLv);
  }
  return d;
}

function showLevelUp(lvInfo){
  var pop=g('levelup-popup');if(!pop)return;
  var badge=g('lu-badge'),name=g('lu-name'),desc=g('lu-desc'),medal=g('lu-medal');
  var isMax=lvInfo.lv===5;
  if(badge)badge.textContent=lvInfo.badge;
  if(badge&&isMax)badge.classList.add(isMax?'badge-glow':'');
  if(name)name.textContent=(lvInfo.name[lang]||lvInfo.name.KO);
  if(desc)desc.textContent=(lvInfo.desc[lang]||lvInfo.desc.KO);
  if(medal){medal.textContent=(lvInfo.medal[lang]||lvInfo.medal.KO);}
  // 레벨업 팝업 확인버튼 번역
  var luBtn2=g('lu-confirm-btn');if(luBtn2)luBtn2.textContent={KO:'확인 ✓',EN:'OK ✓',JP:'確認 ✓',CN:'确认 ✓'}[lang];
  pop.classList.add('on');
}

// SVG 훈장 생성
function makeMedalSVG(lv,size){
  size=size||60;
  var configs={
    1:{bg:'#CD7F32',shine:'#E8A060',symbol:'△',glow:false},
    2:{bg:'#C0C0C0',shine:'#E8E8E8',symbol:'◇',glow:false},
    3:{bg:'#FFD700',shine:'#FFF080',symbol:'★',glow:true},
    4:{bg:'#50C878',shine:'#90E8A0',symbol:'❋',glow:true},
    5:{bg:'#9B59B6',shine:'#C87AFF',symbol:'♛',glow:true}
  };
  var c=configs[lv]||configs[1];
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 60 60">';
  if(c.glow)svg+='<defs><filter id="gf"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  // 외곽 링
  svg+='<circle cx="30" cy="30" r="28" fill="'+c.bg+'" '+(c.glow?'filter="url(#gf)"':'')+'/>';
  svg+='<circle cx="30" cy="30" r="24" fill="none" stroke="'+c.shine+'" stroke-width="2" opacity=".6"/>';
  // 별 패턴 (레벨 수만큼)
  for(var i=0;i<lv;i++){
    var angle=(i*(360/lv)-90)*Math.PI/180;
    var sx=30+18*Math.cos(angle),sy=30+18*Math.sin(angle);
    svg+='<circle cx="'+sx.toFixed(1)+'" cy="'+sy.toFixed(1)+'" r="2.5" fill="'+c.shine+'"/>';
  }
  // 중앙 심볼
  svg+='<text x="30" y="35" font-size="18" text-anchor="middle" fill="'+c.shine+'" font-weight="bold">'+c.symbol+'</text>';
  svg+='</svg>';
  return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
}

/* ── renderGoods 완전 교체 ── */
function renderGoods(){
  var el=g('goods-inner');if(!el)return;
  var expData=getExpData();
  var exp=expData.exp||0;
  var lvInfo=getLevelInfo(exp);
  var nextLv=LEVELS[lvInfo.lv]||null;
  var expInLv=exp-lvInfo.min;
  var expNeeded=nextLv?(nextLv.min-lvInfo.min):1;
  var expPct=nextLv?Math.min((expInLv/expNeeded)*100,100):100;
  var gsData=getGS();
  var goodsCollected=GOODS_KEYS.filter(function(k){return !!gsData[k];}).length;
  var L=function(o){return o[lang]||o.KO;};
  var h='';
  /* 굿즈 받는 방법 */
  h+='<div class="stit">'+L({KO:'굿즈 받는 방법',EN:'HOW TO GET GOODS',JP:'グッズの受取方法',CN:'如何获取周边'})+'</div>';

  var GOODS_LIST=[
    {key:'keyring',icon:'🗝️',nm:{KO:'식당 키링',EN:'Restaurant Keyring',JP:'食堂キーリング',CN:'餐厅钥匙扣'},cost:200},
    {key:'tumbler',icon:'🥤',nm:{KO:'카페 텀블러',EN:'Café Tumbler',JP:'カフェタンブラー',CN:'咖啡杯'},cost:300},
    {key:'sock',  icon:'🧦',nm:{KO:'고기 양말',EN:'BBQ Socks',JP:'焼肉ソックス',CN:'烤肉袜'},cost:200},
    {key:'bandana',icon:'🪢',nm:{KO:'바 반다나',EN:'Bar Bandana',JP:'バーバンダナ',CN:'酒吧头巾'},cost:300},
    {key:'cap',   icon:'🧢',nm:{KO:'수락 캡',EN:'Surak Cap',JP:'スラクキャップ',CN:'水落帽'},cost:500},
  ];



  var L=function(o){return o[lang]||o.KO;};
  // ① 굿즈 획득 여정 (스텝별 시각화)
  h+='<div style="background:var(--acbg2);border-radius:var(--r3);padding:16px;margin-bottom:4px;">';
  h+='<div style="font-size:13px;font-weight:800;color:var(--ac);margin-bottom:14px;">🗺️ '+L({KO:'굿즈 획득까지의 여정',EN:'Your Goods Journey',JP:'グッズ獲得への旅',CN:'获取周边的旅程'})+'</div>';
  var steps=[
    {n:'1',ic:'🏪',t:{KO:'매장 방문',EN:'Visit Store',JP:'店舗訪問',CN:'到店'},d:{KO:'지도 탭에서 매장 탭 → 방문 기록',EN:'Tap store on map → record visit',JP:'地図でお店タップ',CN:'在地图点击门店'},c:'var(--ac)'},
    {n:'2',ic:'📸',t:{KO:'SNS 인증',EN:'SNS Share',JP:'SNS認証',CN:'SNS认证'},d:{KO:'수락산/거리 인증샷 → EXP 적립',EN:'Take SNS proof shot → earn EXP',JP:'認証ショット→EXP積立',CN:'认证截图→积累EXP'},c:'var(--am)'},
    {n:'3',ic:'⛰️',t:{KO:'미션 달성',EN:'Complete Mission',JP:'ミッション達成',CN:'完成任务'},d:{KO:'주간 미션·등산 완주로 EXP 폭발',EN:'Weekly missions & hiking = EXP boost',JP:'週間ミッションでEXP爆発',CN:'周任务和登山获取大量EXP'},c:'var(--bl)'},
    {n:'4',ic:'🎁',t:{KO:'굿즈 교환',EN:'Get Goods',JP:'グッズ交換',CN:'兑换周边'},d:{KO:'아래 교환소에서 EXP로 실물 굿즈 교환!',EN:'Exchange EXP for real goods below!',JP:'下の交換所でEXPを実物グッズに！',CN:'在下方兑换所用EXP换取实物周边！'},c:'var(--re)'},
  ];
  steps.forEach(function(step,i){
    h+='<div style="display:flex;align-items:flex-start;gap:12px;'+(i<steps.length-1?'margin-bottom:14px;':'')+'">';
    h+='<div style="width:28px;height:28px;border-radius:50%;background:'+step.c+';color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">'+step.n+'</div>';
    h+='<div style="flex:1;">';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">';
    h+='<span style="font-size:18px;">'+step.ic+'</span>';
    h+='<span style="font-size:14px;font-weight:800;color:var(--t1);">'+L(step.t)+'</span>';
    h+='</div>';
    h+='<div style="font-size:12px;color:var(--t2);line-height:1.5;">'+L(step.d)+'</div>';
    h+='</div></div>';
    if(i<steps.length-1)h+='<div style="width:2px;height:10px;background:var(--bd);margin-left:13px;margin-bottom:4px;"></div>';
  });
  h+='</div>';

  // ② EXP 적립 방법 (카드형)
  h+='<div class="stit">'+L({KO:'⚡ EXP 적립 방법',EN:'⚡ HOW TO EARN EXP',JP:'⚡ EXP積立方法',CN:'⚡ EXP获取方式'})+'</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;">';
  [{ic:'🏪',t:{KO:'매장 방문',EN:'Store Visit',JP:'店舗訪問',CN:'到店'},p:'+50',d:{KO:'지도에서 매장 탭',EN:'Tap store on map',JP:'地図でお店タップ',CN:'地图点击门店'},c:'var(--acbg2)'},
   {ic:'📅',t:{KO:'데일리 체크인',EN:'Daily Check-in',JP:'デイリーチェックイン',CN:'每日签到'},p:'+20',d:{KO:'마이탭 매일 체크인',EN:'Check in daily on My tab',JP:'毎日チェックイン',CN:'每天在我的标签签到'},c:'var(--acbg2)'},
   {ic:'🎮',t:{KO:'미니게임',EN:'Mini Game',JP:'ミニゲーム',CN:'小游戏'},p:'+5~100',d:{KO:'홈탭 게임 매일 플레이',EN:'Play games daily on Home',JP:'ホームでゲームプレイ',CN:'在首页玩每日游戏'},c:'var(--ambg)'},
   {ic:'📸',t:{KO:'SNS 인증',EN:'SNS Share',JP:'SNS認証',CN:'SNS认证'},p:'+30',d:{KO:'수락산 인증샷 공유',EN:'Share Suraksan proof shot',JP:'水落山認証ショット',CN:'分享水落山认证截图'},c:'var(--ambg)'},
   {ic:'⛰️',t:{KO:'등산 완주',EN:'Hike Complete',JP:'登山完了',CN:'登山完成'},p:'+300',d:{KO:'주봉 완등 인증',EN:'Verify summit completion',JP:'主峰完登認証',CN:'认证主峰登顶'},c:'rgba(42,85,139,.08)'},
   {ic:'🎒',t:{KO:'굿즈 수집',EN:'Collect Goods',JP:'グッズ収集',CN:'收集周边'},p:'+100',d:{KO:'굿즈 교환 완료',EN:'Complete goods exchange',JP:'グッズ交換完了',CN:'完成周边兑换'},c:'rgba(42,85,139,.08)'},
  ].forEach(function(row){
    h+='<div style="background:'+row.c+';border-radius:var(--r3);padding:12px;">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
    h+='<span style="font-size:22px;">'+row.ic+'</span>';
    h+='<span style="font-size:15px;font-weight:900;color:var(--ac);">'+row.p+'<span style="font-size:10px;"> EXP</span></span>';
    h+='</div>';
    h+='<div style="font-size:13px;font-weight:700;color:var(--t1);margin-bottom:3px;">'+L(row.t)+'</div>';
    h+='<div style="font-size:11px;color:var(--t3);line-height:1.4;">'+L(row.d)+'</div>';
    h+='</div>';
  });
  h+='</div>';

  // ④ 굿즈 교환소
  h+='<div class="stit">'+L({KO:'🎁 굿즈 교환소',EN:'🎁 GOODS EXCHANGE',JP:'🎁 グッズ交換所',CN:'🎁 周边兑换'})+'</div>';
  var ptData=getPoints();var totalPt=ptData.total||0;
  h+='<div style="font-size:12px;color:var(--t2);margin-bottom:10px;">🪙 '+L({KO:'보유 포인트',EN:'My Points',JP:'保有ポイント',CN:'持有积分'})+': <b style="color:var(--am);">'+totalPt.toLocaleString()+'P</b></div>';
  GOODS_LIST.forEach(function(gd){
    var owned=!!gsData[gd.key];
    var canBuy=totalPt>=gd.cost&&!owned;
    h+='<div class="goods-exchange-card">';
    h+='<div class="ge-ic">'+gd.icon+'</div>';
    h+='<div style="flex:1;"><div class="ge-nm">'+(owned?'✅ ':'')+L(gd.nm)+'</div>';
    h+='<div class="ge-desc">'+L({KO:'상인회 교환 가능 실물 굿즈',EN:'Exchangeable physical goods',JP:'商人会交換可能な実物グッズ',CN:'可在商家兑换的实物周边'})+'</div>';
    h+='<div class="ge-cost">'+gd.cost+'P '+L({KO:'필요',EN:'required',JP:'必要',CN:'所需'})+'</div></div>';
    h+='<button class="ge-btn" '+(canBuy?'':'disabled')+' data-key="'+gd.key+'" data-cost="'+gd.cost+'">'+(owned?L({KO:'보유중',EN:'Owned',JP:'保有中',CN:'已拥有'}):L({KO:'교환',EN:'Exchange',JP:'交換',CN:'兑换'}))+'</button>';
    h+='</div>';
  });

  // ⑤ 수집 현황
  h+='<div class="stit">'+L({KO:'📊 수집 현황',EN:'📊 COLLECTION',JP:'📊 収集状況',CN:'📊 收集状况'})+'</div>';
  h+='<div class="prog-box"><div class="prog-hd"><div class="prog-lbl">'+T('tgoods')+'</div><div class="prog-cnt">'+goodsCollected+'/5</div></div>';
  h+='<div class="prog-track"><div class="prog-fill" style="width:'+(goodsCollected/5*100)+'%"></div></div>';
  h+='<div style="font-size:11px;color:var(--t3);margin-top:5px;">'+(goodsCollected===5?T('goodsAllDone'):T('goodsKeep'))+'</div></div>';

  el.innerHTML=h;

  // 교환 버튼 이벤트
  el.querySelectorAll('.ge-btn:not([disabled])').forEach(function(btn){
    btn.addEventListener('click',function(){
      var key=this.dataset.key,cost=parseInt(this.dataset.cost);
      if(!usePoint(cost,'굿즈 교환: '+key)){
        showGpsToast(L({KO:'포인트가 부족합니다.',EN:'Not enough points.',JP:'ポイントが不足しています。',CN:'积分不足。'}));
        return;
      }
      var s=getGS();s[key]=true;setGS(s);
      addExp(50,{KO:'굿즈 교환',EN:'Goods exchange',JP:'グッズ交換',CN:'兑换周边'});
      showGpsToast(L({KO:'굿즈를 교환했습니다! 🎁',EN:'Goods exchanged! 🎁',JP:'グッズを交換しました！🎁',CN:'兑换周边成功！🎁'}));
      renderGoods();
    });
  });
}

var JUBONG_PATH=[[37.6583,127.0647],[37.6601,127.0631],[37.6634,127.0612],[37.6672,127.0589],[37.6701,127.0561],[37.6718,127.0548],[37.6733,127.0535]];
var _homePopupMap=null,_trackPolyline=null,_userAltMarker=null;

function initTrackMap(){
  var L=function(o){return o[lang]||o.KO;};

  if(!_mapReady)return;
  var mapDiv=g('track-naver-map');if(!mapDiv)return;
  if(_homePopupMap){naver.maps.Event.trigger(_homePopupMap,'resize');return;}
  _homePopupMap=new naver.maps.Map('track-naver-map',{center:new naver.maps.LatLng(37.666,127.059),zoom:14,mapTypeId:naver.maps.MapTypeId.TERRAIN,zoomControl:false,scrollWheel:false});
  var pathCoords=JUBONG_PATH.map(function(p){return new naver.maps.LatLng(p[0],p[1]);});
  _trackPolyline=new naver.maps.Polyline({path:pathCoords,map:_homePopupMap,strokeColor:'#2C4A1E',strokeWeight:4,strokeOpacity:.9});
  new naver.maps.Marker({position:new naver.maps.LatLng(JUBONG_PATH[0][0],JUBONG_PATH[0][1]),map:_homePopupMap,icon:{content:'<div style="background:#2C4A1E;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)">🚉 수락산역</div>',anchor:new naver.maps.Point(40,15)}});
  new naver.maps.Marker({position:new naver.maps.LatLng(JUBONG_PATH[JUBONG_PATH.length-1][0],JUBONG_PATH[JUBONG_PATH.length-1][1]),map:_homePopupMap,icon:{content:'<div style="background:#8B2A2A;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)">⛰️ 주봉</div>',anchor:new naver.maps.Point(30,15)}});
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude,lng=pos.coords.longitude;
      if(_userAltMarker)_userAltMarker.setMap(null);
      _userAltMarker=new naver.maps.Marker({position:new naver.maps.LatLng(lat,lng),map:_homePopupMap,icon:{content:'<div style="width:14px;height:14px;border-radius:50%;background:#4A90E2;border:3px solid #fff;box-shadow:0 2px 8px rgba(74,144,226,.6);"></div>',anchor:new naver.maps.Point(7,7)}});
      var prog=calcTrackProgress(lat,lng);
      var pf=g('track-prog-fill'),ts=g('track-status-txt');
      if(pf)pf.style.width=prog+'%';
      if(ts)ts.textContent=prog<5?'등산 시작 전':prog<100?'진행 중 '+Math.round(prog)+'%':'🏔️ 정상 도착!';
      /* 고도 업데이트 - DOM 준비 후 실행 */
      setTimeout(function(){
        var SUMMIT=637;
        var altEl=g('alt-cur'),diffEl=g('alt-diff'),barEl=g('alt-bar');
        var alt=pos.coords.altitude;
        if(alt!==null&&alt!==undefined){
          var altM=Math.round(alt);
          var diff=SUMMIT-altM;
          if(altEl)altEl.textContent=altM;
          if(diffEl)diffEl.textContent=diff>0?'정상까지 '+diff+'m':(diff===0?'정상 도착! 🏔️':'정상 +'+Math.abs(diff)+'m');
          if(barEl)barEl.style.width=Math.min(100,Math.max(0,Math.round((altM/SUMMIT)*100)))+'%';
        } else {
          var estAlt=Math.round(50+(prog/100)*(SUMMIT-50));
          if(altEl)altEl.textContent='~'+estAlt;
          if(diffEl)diffEl.textContent='('+L({KO:'추정',EN:'est.',JP:'推定',CN:'估计'})+') '+L({KO:'정상까지',EN:'to summit',JP:'頂上まで',CN:'距顶峰'})+' '+Math.max(0,SUMMIT-estAlt)+'m';
          if(barEl)barEl.style.width=Math.min(100,Math.round((estAlt/SUMMIT)*100))+'%';
        }
      },300);
    },null,{enableHighAccuracy:true});
  }
}

function calcTrackProgress(lat,lng){
  var minDist=Infinity,nearIdx=0;
  JUBONG_PATH.forEach(function(p,i){var d=calcDist(lat,lng,p[0],p[1]);if(d<minDist){minDist=d;nearIdx=i;}});
  return Math.round((nearIdx/(JUBONG_PATH.length-1))*100);
}

function openHomePopup(type){
  var pop=g('home-popup'),box=g('home-popup-box'),title=g('hp-title-text'),body=g('hp-body');
  if(!pop||!body)return;
  var L=function(o){return o[lang]||o.KO;};
  var html='';
  var titles={
    course:{KO:'⛰️ 코스 트래킹',EN:'⛰️ Course Tracking',JP:'⛰️ コーストラッキング',CN:'⛰️ 路线追踪'},
    safety:{KO:'⛑️ 안전 정보',EN:'⛑️ Safety Info',JP:'⛑️ 安全情報',CN:'⛑️ 安全信息'},
    weather:{KO:'🌤️ 실시간 날씨',EN:'🌤️ Live Weather',JP:'🌤️ リアルタイム天気',CN:'🌤️ 实时天气'},
    goods:{KO:'🎒 굿즈 받는 방법',EN:'🎒 How to Get Goods',JP:'🎒 グッズ受取方法',CN:'🎒 如何领取周边'},
    mode:{KO:'오늘의 모드 선택',EN:"Select Today's Mode",JP:'今日のモード選択',CN:'选择今日模式'},
    runway:{KO:'✨ 빛의 런웨이',EN:'✨ Light Runway',JP:'✨ 光のランウェイ',CN:'✨ 光之跑道'},
    onuri:{KO:'🏷️ 온누리상품권 가맹점',EN:'🏷️ Onuri Voucher Stores',JP:'🏷️ オヌリ商品券加盟店',CN:'🏷️ 温누리券门店'}
  };
  if(title)title.textContent=L(titles[type]||titles.course);

  if(type==='course'){
    html+='<div class="track-map-wrap"><div id="track-naver-map"></div>';
    html+='<div class="track-overlay"><div class="track-status" id="track-status-txt">'+L({KO:'GPS 추적 준비 중...',EN:'GPS ready...',JP:'GPS準備中...',CN:'GPS准备中...'})+'</div>';
    html+='<div class="track-prog-bar"><div class="track-prog-fill" id="track-prog-fill" style="width:0%"></div></div></div></div>';
    html+='<div class="altitude-card"><div><div class="alt-num" id="alt-cur">--</div><div class="alt-unit">m</div><div class="alt-diff" id="alt-diff">'+L({KO:'정상까지 --m',EN:'--m to summit',JP:'頂上まで--m',CN:'距顶峰--m'})+'</div></div>';
    html+='<div class="alt-bar-wrap"><div class="alt-bar-label"><span>'+L({KO:'현재 고도',EN:'Altitude',JP:'現在高度',CN:'当前高度'})+'</span><span>637m</span></div>';
    html+='<div class="alt-bar-outer"><div class="alt-bar-inner" id="alt-bar" style="width:0%"></div></div></div></div>';
    var lms=TRAILS[0].landmarks||[];
    html+='<div class="stit">'+L({KO:'구간별 안내',EN:'SECTION GUIDE',JP:'区間別案内',CN:'分段指南'})+'</div>';
    lms.forEach(function(l){
      var nm=L(l.name),desc=L(l.desc),warn=l.warn?L(l.warn):null;
      html+='<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--bd2);">';
      html+='<span style="font-size:22px;flex-shrink:0;">'+l.icon+'</span>';
      html+='<div><div style="font-size:13px;font-weight:800;color:var(--t1);">'+nm+'</div>';
      html+='<div style="font-size:11px;color:var(--t3);">⏱ '+l.time+L({KO:'분',EN:'min',JP:'分',CN:'分'})+' · ↑'+l.elev+'m</div>';
      html+='<div style="font-size:12px;color:var(--t2);margin-top:3px;line-height:1.5;">'+desc+'</div>';
      if(warn)html+='<div style="font-size:11px;color:var(--re);font-weight:700;margin-top:3px;">'+warn+'</div>';
      html+='</div></div>';
    });
  }
  else if(type==='safety'){
    html+='<div class="safety-info-card">';
    [{ic:'🌤️',t:{KO:'현재 날씨',EN:'Weather',JP:'天気',CN:'天气'},id:'sp-weather'},
     {ic:'🌡️',t:{KO:'기온',EN:'Temperature',JP:'気温',CN:'温度'},id:'sp-temp'},
     {ic:'💨',t:{KO:'풍속',EN:'Wind',JP:'風速',CN:'风速'},id:'sp-wind'},
     {ic:'💧',t:{KO:'습도',EN:'Humidity',JP:'湿度',CN:'湿度'},id:'sp-hum'},
     {ic:'🕐',t:{KO:'하산 권장 시간',EN:'Descend by',JP:'下山推奨',CN:'建议下山'},id:'sp-descend'},
     {ic:'🌅',t:{KO:'일몰 시간',EN:'Sunset',JP:'日没',CN:'日落'},id:'sp-sunset'}
    ].forEach(function(item){
      html+='<div class="safety-info-row"><span class="safety-info-ic">'+item.ic+'</span>';
      html+='<span class="safety-info-t">'+L(item.t)+'</span>';
      html+='<span class="safety-info-v" id="'+item.id+'">--</span></div>';
    });
    html+='</div>';
    html+='<div class="stit">'+L({KO:'안전 수칙',EN:'SAFETY RULES',JP:'安全ルール',CN:'安全规则'})+'</div><div class="card">';
    [{ic:'🌅',t:{KO:'일출 1시간 전 입산 권장',EN:'Enter 1hr before sunrise',JP:'日の出1時間前入山推奨',CN:'建议日出前1小时入山'}},
     {ic:'⏰',t:{KO:'일몰 1시간 전 하산 완료',EN:'Descend 1hr before sunset',JP:'日没1時間前に下山',CN:'日落前1小时完成下山'}},
     {ic:'🔥',t:{KO:'화기 사용 절대 금지',EN:'No open flames',JP:'火気使用絶対禁止',CN:'严禁使用明火'}},
     {ic:'💧',t:{KO:'식수 1L 이상 준비',EN:'Bring 1L+ water',JP:'飲料水1L以上準備',CN:'准备1L以上饮水'}},
     {ic:'👟',t:{KO:'등산화 착용 필수',EN:'Hiking boots required',JP:'登山靴着用必須',CN:'必须穿登山鞋'}},
     {ic:'📱',t:{KO:'배터리 충전 후 출발',EN:'Charge phone before hiking',JP:'充電してから出発',CN:'出发前充满电'}}
    ].forEach(function(r){
      html+='<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bd2);">';
      html+='<span style="font-size:18px;">'+r.ic+'</span><span style="font-size:13px;color:var(--t2);">'+L(r.t)+'</span></div>';
    });
    html+='</div>';
  }
  else if(type==='weather'){
    html+='<div style="text-align:center;padding:20px 0;">';
    html+='<div id="wp-ico" style="font-size:64px;margin-bottom:10px;">⏳</div>';
    html+='<div id="wp-temp" style="font-size:48px;font-weight:800;color:var(--t1);">--°C</div>';
    html+='<div id="wp-desc" style="font-size:16px;color:var(--t3);margin-top:5px;">'+L({KO:'불러오는 중...',EN:'Loading...',JP:'取得中...',CN:'加载中...'})+'</div></div>';
    html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">';
    [{ic:'💧',l:{KO:'습도',EN:'Humidity',JP:'湿度',CN:'湿度'},id:'wp-hum'},
     {ic:'💨',l:{KO:'풍속',EN:'Wind',JP:'風速',CN:'风速'},id:'wp-wind'},
     {ic:'🥾',l:{KO:'등산',EN:'Hiking',JP:'登山',CN:'登山'},id:'wp-hike'}
    ].forEach(function(item){
      html+='<div style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r2);padding:12px;text-align:center;">';
      html+='<div style="font-size:22px;margin-bottom:5px;">'+item.ic+'</div>';
      html+='<div style="font-size:10px;color:var(--t3);margin-bottom:4px;">'+L(item.l)+'</div>';
      html+='<div style="font-size:14px;font-weight:800;color:var(--t1);" id="'+item.id+'">--</div></div>';
    });
    html+='</div>';
  }
  else if(type==='mode'){
    [{id:'walk',ic:'🚶',t:{KO:'산책 모드',EN:'Stroll Mode',JP:'散策モード',CN:'散步模式'},d:{KO:'카페, 맛집 위주 추천. +20 EXP/일',EN:'Café & food recs. +20 EXP/day',JP:'カフェ・グルメ推薦。+20 EXP/日',CN:'推荐咖啡馆和美食。+20 EXP/天'}},
     {id:'active',ic:'⛰️',t:{KO:'등산 모드',EN:'Hiking Mode',JP:'登山モード',CN:'登山模式'},d:{KO:'코스 가이드 + 실시간 트래킹. +50 EXP/일',EN:'Course guide + tracking. +50 EXP/day',JP:'コースガイド+トラッキング。+50 EXP/日',CN:'路线指南+追踪。+50 EXP/天'}},
     {id:'relax',ic:'☕',t:{KO:'머묾 모드',EN:'Relax Mode',JP:'まったりモード',CN:'休闲模式'},d:{KO:'카페, 문화, 음악. +20 EXP/일',EN:'Cafés, culture, music. +20 EXP/day',JP:'カフェ、文化、音楽。+20 EXP/日',CN:'咖啡、文化、音乐。+20 EXP/天'}}
    ].forEach(function(m){
      var isOn=_currentMode===m.id;
      html+='<div class="home-mode-item'+(isOn?' on':'')+'" data-mode-id="'+m.id+'">';
      html+='<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:32px;">'+m.ic+'</span>';
      html+='<div><div style="font-size:15px;font-weight:800;color:'+(isOn?'var(--ac)':'var(--t1)')+';">'+L(m.t)+'</div>';
      html+='<div style="font-size:12px;color:var(--t3);margin-top:3px;line-height:1.5;">'+L(m.d)+'</div></div></div></div>';
    });
  }

  body.innerHTML=html;
  pop.style.display='flex';
  setTimeout(function(){pop.classList.add('on');},10);

  if(type==='course')setTimeout(initTrackMap,300);
  if(type==='safety'||type==='weather'){
    fetchWeather(function(wd){
      if(!wd)return;
      var ok=hikingOk(wd.code,wd.temp);
      if(type==='weather'){
        var ico=g('wp-ico'),tmp=g('wp-temp'),desc=g('wp-desc'),hum=g('wp-hum'),wind=g('wp-wind'),hike=g('wp-hike');
        if(ico)ico.textContent=weatherIcon(wd.code);if(tmp)tmp.textContent=wd.temp+'°C';
        if(desc)desc.textContent=weatherDesc(wd.code);if(hum)hum.textContent=wd.hum+'%';
        if(wind)wind.textContent=wd.wind+'m/s';
        if(hike)hike.textContent=ok?L({KO:'좋음 ✅',EN:'Good ✅',JP:'良い ✅',CN:'良好 ✅'}):L({KO:'주의 ⚠️',EN:'Caution ⚠️',JP:'注意 ⚠️',CN:'注意 ⚠️'});
      }
      if(type==='safety'){
        var sw=g('sp-weather'),st=g('sp-temp'),swi=g('sp-wind'),sh=g('sp-hum'),sd=g('sp-descend'),ss=g('sp-sunset');
        if(sw)sw.textContent=weatherDesc(wd.code);if(st)st.textContent=wd.temp+'°C';
        if(swi)swi.textContent=wd.wind+'m/s';if(sh)sh.textContent=wd.hum+'%';
        if(sd){sd.textContent='18:30';sd.className='safety-info-v'+(ok?'':' warn');}
        if(ss)ss.textContent='19:30';
      }
    });
  }
  if(type==='goods'){
    html+='<div style="padding:8px 0;">';
    [{ic:'📸',t:{KO:'수락산 어디서든 SNS 인증 1회',EN:'SNS cert once on Suraksan',JP:'スラクサンでSNS認証1回',CN:'水落山任意地点认证1次'}},
     {ic:'🏪',t:{KO:'카테고리별 매장 방문 후 결제',EN:'Visit & pay at category store',JP:'カテゴリ店舗で支払',CN:'前往类别店铺付款'}},
     {ic:'🎒',t:{KO:'굿즈 수령!',EN:'Receive your goods!',JP:'グッズ受取！',CN:'领取周边！'}}
    ].forEach(function(s){
      html+='<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--bd2);">';
      html+='<div style="width:36px;height:36px;border-radius:50%;background:var(--ac);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">'+s.ic+'</div>';
      html+='<div style="font-size:13px;color:var(--t1);font-weight:600;">'+L(s.t)+'</div></div>';
    });
    html+='<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r2);padding:12px;margin-top:12px;font-size:12px;color:var(--t2);">';
    html+=L({KO:'5종: 🗝️키링 · 🧦등산양말 · 🥤텀블러 · 🪢반다나 · 🧢캠프캡',EN:'5 types: 🗝️Keyring · 🧦Socks · 🥤Tumbler · 🪢Bandana · 🧢Cap',JP:'5種: 🗝️キーリング · 🧦ソックス · 🥤タンブラー · 🪢バンダナ · 🧢キャップ',CN:'5种: 🗝️钥匙扣 · 🧦袜子 · 🥤保温杯 · 🪢头巾 · 🧢帽子'});
    html+='</div></div>';
  }

  else if(type==='runway'){
    html+='<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:var(--r3);padding:20px;color:#fff;margin-bottom:12px;position:relative;overflow:hidden;">';
    html+='<div style="position:absolute;right:10px;bottom:-10px;font-size:64px;opacity:.1;">✨</div>';
    html+='<div style="font-size:22px;font-weight:800;margin-bottom:8px;">'+L({KO:'빛의 런웨이',EN:'Light Runway',JP:'光のランウェイ',CN:'光之跑道'})+'</div>';
    html+='<div style="font-size:13px;opacity:.8;line-height:1.7;margin-bottom:14px;">'+L({KO:'수락디자인거리 전체를 수놓는 계절별 테마 고보 조명 연출입니다. 매일 저녁 수락산의 자연과 거리의 감성이 하나로 어우러지는 30분의 빛의 향연.',EN:'Seasonal themed gobo lighting illuminates all of Surak Design Street. Every evening, 30 minutes where nature and street culture become one.',JP:'スラクデザイン通り全体を彩る季節別テーマ照明演出。毎晩、水落山の自然と通りの感性が一体となる30分の光の饗宴。',CN:'装点整条水落设计街的四季主题灯光演出，每晚大自然与街道文化交融的30分钟光之盛宴。'})+'</div>';
    html+='<div style="background:rgba(255,255,255,.12);border-radius:var(--r2);padding:14px;display:flex;align-items:center;gap:14px;">';
    html+='<span style="font-size:32px;">🕗</span>';
    html+='<div><div style="font-size:11px;opacity:.6;margin-bottom:3px;">'+L({KO:'매일 운영',EN:'Daily',JP:'毎日運営',CN:'每日运营'})+'</div>';
    html+='<div style="font-size:24px;font-weight:800;">20:00 ~ 20:30</div>';
    html+='<div style="font-size:11px;opacity:.7;margin-top:3px;">'+L({KO:'약 30분 · 수락디자인거리 전구간',EN:'~30min · All of Surak Design Street',JP:'約30分 · スラクデザイン通り全区間',CN:'约30分钟 · 水落设计街全线'})+'</div></div></div></div>';
    html+='<div class="stit">'+L({KO:'계절별 테마',EN:'SEASONAL THEMES',JP:'季節別テーマ',CN:'四季主题'})+'</div>';
    [{season:{KO:'봄',EN:'Spring',JP:'春',CN:'春'},icon:'🌸',desc:{KO:'벚꽃 & 파스텔 핑크 톤 조명',EN:'Cherry blossom & pastel pink lighting',JP:'桜＆パステルピンクトーン照明',CN:'樱花&粉彩粉色调灯光'}},
     {season:{KO:'여름',EN:'Summer',JP:'夏',CN:'夏'},icon:'💙',desc:{KO:'수락산 계곡 & 쿨 블루 톤',EN:'Suraksan valley & cool blue tone',JP:'水落山渓谷＆クールブルートーン',CN:'水落山溪谷&冷蓝色调'}},
     {season:{KO:'가을',EN:'Autumn',JP:'秋',CN:'秋'},icon:'🍂',desc:{KO:'단풍 & 웜 오렌지 앰버 톤',EN:'Autumn leaves & warm orange amber',JP:'紅葉＆ウォームオレンジアンバー',CN:'红叶&暖橙琥珀色调'}},
     {season:{KO:'겨울',EN:'Winter',JP:'冬',CN:'冬'},icon:'❄️',desc:{KO:'눈꽃 & 아이스 화이트 블루 톤',EN:'Snowflake & ice white blue tone',JP:'雪花＆アイスホワイトブルー',CN:'雪花&冰白蓝色调'}}
    ].forEach(function(s){
      html+='<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bd2);">';
      html+='<span style="font-size:24px;">'+s.icon+'</span>';
      html+='<div><div style="font-size:13px;font-weight:700;color:var(--t1);">'+L(s.season)+'</div>';
      html+='<div style="font-size:12px;color:var(--t3);">'+L(s.desc)+'</div></div></div>';
    });
  }
  else if(type==='onuri'){
    var onuriStores=STORES.filter(function(s){return s.onuri;});
    html+='<div style="background:linear-gradient(135deg,#C41E3A,#8B1428);border-radius:var(--r3);padding:14px;color:#fff;margin-bottom:12px;">';
    html+='<div style="font-size:11px;opacity:.7;letter-spacing:1px;margin-bottom:4px;">ONURI VOUCHER</div>';
    html+='<div style="font-size:18px;font-weight:800;margin-bottom:4px;">🏷️ '+L({KO:'온누리상품권',EN:'Onuri Gift Voucher',JP:'オヌリ商品券',CN:'温누리商品券'})+'</div>';
    html+='<div style="font-size:12px;opacity:.8;">'+L({KO:'수락 스트릿 내 '+onuriStores.length+'개 매장에서 사용 가능',EN:onuriStores.length+' stores in Surak Street accept Onuri vouchers',JP:'スラクストリート内'+onuriStores.length+'店舗で使用可能',CN:'水落街内'+onuriStores.length+'家店铺可使用'})+'</div></div>';
    var catColors={food:'#4A7A35',gogi:'#8B3A2A',cafe:'#2A558B',bar:'#6B3A8B'};
    html+='<div style="display:flex;flex-direction:column;gap:6px;">';
    onuriStores.forEach(function(s){
      var nm=lang==='EN'?s.en:lang==='JP'?s.jp:lang==='CN'?s.cn:s.ko;
      var col=catColors[s.cat]||'var(--ac)';
      html+='<div onclick="closeHomePopup();openPopup(STORES.find(function(x){return x.id==='+s.id+'}))" style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r2);padding:10px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;">';
      html+='<div style="width:8px;height:8px;border-radius:50%;background:'+col+';flex-shrink:0;"></div>';
      html+='<div style="flex:1;"><div style="font-size:13px;font-weight:700;color:var(--t1);">'+nm+'</div>';
      html+='<div style="font-size:11px;color:var(--t3);">'+s.addr+'</div></div>';
      html+='<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#C41E3A22;color:#C41E3A;">🏷️</span>';
      html+='</div>';
    });
    html+='</div>';
  }
  if(type==='mode'){
    body.querySelectorAll('.home-mode-item').forEach(function(item){
      item.style.cssText='background:var(--sf);border:2px solid '+(item.classList.contains('on')?'var(--ac)':'var(--bd)')+';border-radius:var(--r3);padding:16px;margin-bottom:10px;cursor:pointer;'+(item.classList.contains('on')?'background:var(--acbg);':'');
      item.addEventListener('click',function(){
        var mid=this.dataset.modeId;
        _currentMode=mid;_currentPlayUrl=SC_PLAYLISTS[mid]?SC_PLAYLISTS[mid].default:null;_userOverride=true;
        addExp(20,{KO:'모드 선택',EN:'Mode select',JP:'モード選択',CN:'选择模式'});
        closeHomePopup();renderHome();
      });
    });
  }
}

function closeHomePopup(){
  var pop=g('home-popup');if(!pop)return;
  pop.classList.remove('on');
  setTimeout(function(){pop.style.display='none';},320);
}

/* ═══ 수락이 챗봇 ═══ */
var _chatOpen=false,_chatHistory=[],_guideIdx2=0;

var CHAT_SYSTEM={
  KO:`당신은 '수락이'입니다. 수락산과 수락디자인거리를 안내하는 귀엽고 친근한 청설모 캐릭터입니다.
3-5문장으로 짧고 친절하게 답하세요. 이모지 적극 활용. 반말로 답해요.
답변에 '수락이:' 같은 접두어 붙이지 마세요.

[수락산 기본 정보]
- 위치: 서울 노원구·경기 의정부시 경계, 해발 637m
- 코스: 벽운계곡(3.5km·2h 초중급), 주봉코스(8.2km·4h 중급), 둘레길(6.1km·2h 초급)
- 특징: 기차바위, 은류폭포, 향로봉, 벽운계곡, 깔딱고개, 독수리바위
- 접근: 7·4호선 수락산역 3번출구 도보 1분

[수락디자인거리]
- 매장 51개: 식당28·고기8·카페7·바/야간8
- 빛의 런웨이: 매일 20:00~20:30
- 굿즈: 카테고리별 SNS인증 후 수령 (키링/텀블러/양말/반다나/캡)
- 온누리상품권: 일부 식당·고기 매장 사용 가능

[레벨 시스템]
- 입산자(0~500) → 길잡이(500~1500) → 숙련가(1500~3000) → 산악대장(3000~6000) → 명예수호자(6000+)
- EXP: 매장방문 50, 굿즈수집 100, 등산완주 300, SNS공유 30

[천상병 시인 - 비하인드 포함]
- 1930-1993, 수락산 자락 상계동 거주
- 대표작 귀천(歸天): "나 하늘로 돌아가리라..."
- 비하인드: 매일 아침 수락산 산책할 때 돈 한 푼 없이 나와서, 동네 주민이나 등산객을 만나면 특유의 아이같은 미소로 "나 천상병인데 막걸리 값 1천원만 빌려주게나!" 하고 당당하게 요구했다. 주민들은 대한민국 최고 시인인 줄 알면서도 허허 웃으며 지갑을 열었고, 그 돈으로 수락산 자락 대포집에서 막걸리 한 잔 마시며 행복한 소풍을 즐겼다.
- 키워드: 막걸리, 소풍, 귀천, 천상병

[김시습 - 비하인드 포함]
- 조선시대 천재 문인, 금오신화 저자
- 5살에 세종대왕 앞에서 완벽한 시를 지어 감탄을 받음
- 비하인드: 세종대왕이 "20살이 되면 내가 직접 거두어 귀하게 쓰겠다"며 비단 50필을 상으로 내렸는데, "혼자 힘으로 가져갈 수 있으면 가져가라"고 농담을 던졌다. 5살 김시습은 비단들을 끈으로 묶어 온몸에 칭칭 감고 영차영차 끌고 나갔다! 궁궐 사람들이 자지러졌다. 하지만 세종 아들 세조가 단종을 몰아내자, 21살 김시습은 책을 불태우고 수락산 동막골에 10년 은거하며 금오신화를 완성했다.
- 키워드: 김시습, 비단 50필, 세종대왕, 금오신화, 은거

[인현왕후 - 비하인드 포함]
- 조선 숙종의 비, 장희빈에 의해 폐위되었다가 복위
- 비하인드: 폐위 후 수락산 흥국사에 은거하며 매일 바위산에 올라 눈물로 기도했다. 5년 만에 복위한 후, 인현왕후와 상궁들은 흥국사를 잊지 못해 정기적으로 내려와 왕실 안녕을 비는 대규모 재(齋)를 지냈다. 지금 수락산 디자인거리를 걸을 때 느끼는 은은한 기운은 어쩌면 쫓겨난 왕비가 마침내 승리하고 남긴 기적의 에너지일지도 모른다.
- 키워드: 인현왕후, 흥국사, 장희빈, 복위, 기도

[안전]
- 일출 1시간 전 입산, 일몰 1시간 전 하산
- 화기 사용 금지, 등산화 필수
- 깔딱고개: 급경사 로프구간, 낙석 주의!`,

  EN:`You are 'Surak-i', a cute squirrel guide for Suraksan and Surak Design Street.
Answer in 3-5 sentences, friendly and concise. Use emojis. No prefix like 'Surak-i:'.

[Suraksan] 637m, Line 7/4 Suraksan Station Exit 3.
Routes: Byeokun Valley(3.5km·2h), Summit(8.2km·4h), Dulle Trail(6.1km·2h)

[Surak Design Street] 51 stores, Light Runway 20:00~20:30 daily.

[Level System] Newcomer→Pathfinder→Expert→Mountain Captain→Guardian of Honor

[Poet Cheon] Behind-the-scenes: Every morning he walked Suraksan with no money, and would cheerfully ask locals "I'm Cheon Sang-byeong — lend me 1,000 won for makgeolli!" They always opened their wallets for the famous poet. He spent it on a cup of makgeolli at the local pub, living his "happy picnic".

[Kim Si-seup] Behind-the-scenes: King Sejong gave 5-year-old Kim 50 bolts of silk as a reward, jokingly saying "take it if you can carry it alone." The boy tied the silks together, wrapped them around his body, and dragged them out! Years later, disgusted by injustice, he burned his books and hid in Suraksan for 10 years, writing Korea first novel Geumo Sinhwa.

[Queen Inhyeon] Behind-the-scenes: After being demoted, she hid at Heungguksa Temple on Suraksan, climbing rocky paths daily to pray with tears. After her miraculous comeback 5 years later, she and her court ladies returned regularly to perform memorial rites there.`,

  JP:`あなたは「スラキ」。水落山とスラクデザイン通りを案内するかわいいリスです。
3-5文で友好的に答えてください。絵文字を使ってください。「スラキ:」などの接頭語は不要。

[水落山] 637m、7/4号線スラクサン駅3番出口徒歩1分

[スラクデザイン通り] 51店舗、光のランウェイ20:00~20:30毎日

[詩人千尚炳 ビハインド] 毎朝一文無しで散歩に出かけ、住民に「千尚炳だが、マッコリ代1000ウォン貸してくれ！」と頼んだ。住民たちは大詩人とわかりながらも財布を開け、その金でマッコリを飲む「楽しいピクニック」を楽しんだ。

[金時習 ビハインド] 5歳で世宗大王から絹50反を賜り「一人で持って行けたら持って行け」と言われると、全部縛って体に巻いて引きずって出た！後に不義に幻滅し、スラクサンに10年隠居して韓国初の小説「金鰲新話」を完成させた。

[仁顕王后 ビハインド] 廃位後スラクサン興国寺に隠れ、毎日泣きながら祈り続けた。5年後に復位した後、宮廷女官たちが定期的に興国寺を訪れ大規模な追悼を行った。`,

  CN:`您是"水落"，负责介绍水落山和水落设计街的可爱松鼠向导。
用3-5句话简短友好地回答，适当使用表情符号。不需要"水落:"等前缀。

[水落山] 637m，7/4号线水落山站3号出口步行1分

[水落设计街] 51家店铺，光之跑道每日20:00~20:30

[诗人千尚炳 幕后] 每天早晨空着口袋去散步，遇到居民就笑着说"我是千尚炳，借我1000韩元喝米酒！"居民们知道是大诗人，还是打开钱包，他用这钱在小酒馆喝杯米酒，享受"快乐郊游"。

[金时习 幕后] 5岁时世宗大王赐给他50匹绸缎，说"一个人能拿走就拿走"，他把绸缎绑在一起缠在身上拖出去了！后来对不义感到幻灭，在水落山隐居10年，完成了韩国第一部小说《金鳌新话》。

[仁显王后 幕后] 废位后隐居水落山兴国寺，每天含泪祈祷。5年后复位，宫廷女官们定期前来举行大规模祭祀活动。`
};

var QUICK_QS={
  KO:['⛰️ 등산 코스','🌤️ 오늘 날씨','🍽️ 맛집 추천','🎒 굿즈 받는 법','🖊️ 귀천 비하인드','📚 비단 50필 얘기','🌙 인현왕후 이야기','✨ 빛의 런웨이'],
  EN:['⛰️ Hiking Routes','🌤️ Weather','🍽️ Food Recs','🎒 How to get Goods','🖊️ Cheon Behind Story','📚 Kim Si-seup Story','🌙 Queen Inhyeon','✨ Light Runway'],
  JP:['⛰️ 登山コース','🌤️ 今日の天気','🍽️ グルメ情報','🎒 グッズ受取','🖊️ 千尚炳ビハインド','📚 金時習の話','🌙 仁顕王后の話','✨ 光のランウェイ'],
  CN:['⛰️ 登山路线','🌤️ 今日天气','🍽️ 美食推荐','🎒 领取周边','🖊️ 千尚炳幕后','📚 金时习的故事','🌙 仁显王后的故事','✨ 光之跑道']
};
var WELCOME={
  KO:'안녕! 나는 수락이야 🐿️ 수락산이나 수락 스트릿에 대해 뭐든 물어봐!',
  EN:'Hi! I\'m Surak-i 🐿️ Ask me anything about Suraksan or Surak Street!',
  JP:'こんにちは！スラキだよ🐿️ 水落山やスラクデザイン通りについて何でも聞いてね！',
  CN:'你好！我是水落🐿️ 关于水落山或水落设计街，什么都可以问我！'
};

function toggleChat(){
  _chatOpen=!_chatOpen;
  var win=g('chat-window');
  if(!win)return;
  if(_chatOpen){
    win.classList.add('open');
    if(_chatHistory.length===0)initChat();
  }else{
    win.classList.remove('open');
  }
}
function initChat(){
  var msgs=g('chat-msgs');if(!msgs)return;
  msgs.innerHTML='';_chatHistory=[];
  addBotMsg(WELCOME[lang]||WELCOME.KO);
  renderChatQuick();
}
function addBotMsg(txt){
  var msgs=g('chat-msgs');if(!msgs)return;
  var row=document.createElement('div');row.className='chat-row-bot';
  row.innerHTML='<img src="'+SURAK_IMG+'" class="chat-av-sm" alt="수락이"/>'
    +'<div class="chat-bubble-bot">'+txt.replace(/\n/g,'<br>')+'</div>';
  msgs.appendChild(row);msgs.scrollTop=msgs.scrollHeight;
}
function addUserMsg(txt){
  var msgs=g('chat-msgs');if(!msgs)return;
  var row=document.createElement('div');row.className='chat-row-user';
  row.innerHTML='<div class="chat-bubble-user">'+txt+'</div>';
  msgs.appendChild(row);msgs.scrollTop=msgs.scrollHeight;
}
function addTyping(){
  var msgs=g('chat-msgs');if(!msgs)return;
  var row=document.createElement('div');row.className='chat-row-bot';row.id='chat-typing-row';
  row.innerHTML='<img src="'+SURAK_IMG+'" class="chat-av-sm" alt="수락이"/>'
    +'<div class="chat-bubble-bot"><div class="chat-typing"><div class="chat-dot"></div><div class="chat-dot"></div><div class="chat-dot"></div></div></div>';
  msgs.appendChild(row);msgs.scrollTop=msgs.scrollHeight;
}
function removeTyping(){var r=g('chat-typing-row');if(r)r.remove();}
function renderChatQuick(){
  var el=g('chat-quick');if(!el)return;
  var qs=QUICK_QS[lang]||QUICK_QS.KO;
  el.innerHTML='';
  qs.forEach(function(q){
    var btn=document.createElement('button');btn.className='chat-q-btn';btn.textContent=q;
    btn.onclick=function(){sendChatMsg(this.textContent);};
    el.appendChild(btn);
  });
}
function sendChat(){
  var inp=g('chat-input');if(!inp)return;
  var msg=inp.value.trim();if(!msg)return;
  inp.value='';sendChatMsg(msg);
}
function sendChatMsg(msg){
  addUserMsg(msg);
  _chatHistory.push({role:'user',content:msg});
  addTyping();
  // 비하인드 키워드 EXP 보상
  var behindKW={KO:['막걸리','귀천','천상병','비단 50필','김시습','세종대왕','인현왕후','장희빈','흥국사'],EN:['makgeolli','Geumo','Kim Si-seup','Sejong','Inhyeon','Jang Hee-bin'],JP:['マッコリ','金鰲','金時習','世宗','仁顕王后'],CN:['米酒','金鳌','金时习','世宗','仁显王后']};
  var kws=behindKW[lang]||behindKW.KO;
  var matched=kws.some(function(k){return msg.indexOf(k)>=0;});
  if(matched){
    addExp(5,{KO:'비하인드 스토리 탐구',EN:'Behind story explored',JP:'ビハインドストーリー探求',CN:'探索幕后故事'});
    showGpsToast({KO:'💡 비하인드 탐구 +5 EXP!',EN:'💡 Behind story +5 EXP!',JP:'💡 ビハインド探求 +5 EXP！',CN:'💡 幕后故事 +5 EXP！'}[lang]);
  }
  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens:400,
      system:CHAT_SYSTEM[lang]||CHAT_SYSTEM.KO,
      messages:_chatHistory.slice(-6)
    })
  }).then(function(r){return r.json();})
  .then(function(data){
    removeTyping();
    var reply='';
    if(data.content&&data.content[0])reply=data.content[0].text||'';
    if(!reply){var em={KO:'잠시 후 다시 시도해줘 🙏',EN:'Please try again 🙏',JP:'後でもう一度試してね🙏',CN:'请稍后再试🙏'};reply=em[lang]||em.KO;}
    _chatHistory.push({role:'assistant',content:reply});
    addBotMsg(reply);
  }).catch(function(){
    removeTyping();
    var em={KO:'네트워크 오류 😅',EN:'Network error 😅',JP:'ネットワークエラー😅',CN:'网络错误😅'};
    addBotMsg(em[lang]||em.KO);
  });
}

/* ═══ 간편로그인 시스템 ═══ */
var _user = null;

// 앱 설정 (실제 키는 여기서 교체)
var LOGIN_CONFIG = {
  kakao: { appKey: 'YOUR_KAKAO_APP_KEY' },
  naver: { clientId: 'YOUR_NAVER_CLIENT_ID', callbackUrl: 'https://surakstreet.com/callback' },
  google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' }
};

function getUserData(){
  try{return JSON.parse(localStorage.getItem('surak_user')||'null');}catch(e){return null;}
}
function saveUser(user){
  try{localStorage.setItem('surak_user',JSON.stringify(user));}catch(e){}
  _user=user;
}
function logout(){
  if(typeof fbLogout==='function') fbLogout();
  localStorage.removeItem('surak_user');
  _user=null;
  var mi=g('my-inner');if(mi)delete mi.dataset.done;
  renderMy();
  showGpsToast({KO:'로그아웃되었습니다.',EN:'Logged out.',JP:'ログアウトしました。',CN:'已退出登录。'}[lang]||'로그아웃');
}

function openLoginPopup(){
  var pop=g('login-popup');if(!pop)return;
  pop.style.display='flex';
  setTimeout(function(){pop.classList.add('on');},10);
}
function closeLoginPopup(){
  var pop=g('login-popup');if(!pop)return;
  pop.classList.remove('on');
  setTimeout(function(){pop.style.display='none';},300);
}

// 카카오 로그인
function loginKakao(){
  if(typeof Kakao==='undefined'){
    // SDK 미로드 시 더미 로그인 (개발용)
    handleLoginSuccess({id:'kakao_'+Date.now(),name:'수락이',email:'surak@kakao.com',provider:'kakao',avatar:null});
    return;
  }
  Kakao.Auth.login({
    success:function(auth){
      Kakao.API.request({url:'/v2/user/me',success:function(res){
        handleLoginSuccess({
          id:'kakao_'+res.id,
          name:res.kakao_account&&res.kakao_account.profile?res.kakao_account.profile.nickname:'수락이',
          email:res.kakao_account?res.kakao_account.email:'',
          provider:'kakao',
          avatar:res.kakao_account&&res.kakao_account.profile?res.kakao_account.profile.thumbnail_image_url:null
        });
      }});
    },
    fail:function(err){console.log('Kakao login failed',err);}
  });
}

// 네이버 로그인
function loginNaver(){
  if(typeof naver_id_login==='undefined'){
    handleLoginSuccess({id:'naver_'+Date.now(),name:'수락이',email:'surak@naver.com',provider:'naver',avatar:null});
    return;
  }
  var naverLogin=new naver_id_login(LOGIN_CONFIG.naver.clientId,LOGIN_CONFIG.naver.callbackUrl);
  naverLogin.getLoginStatus(function(status){
    if(status){
      handleLoginSuccess({
        id:'naver_'+naverLogin.getProfileData('id'),
        name:naverLogin.getProfileData('name'),
        email:naverLogin.getProfileData('email'),
        provider:'naver',avatar:naverLogin.getProfileData('profile_image')
      });
    }
  });
  naverLogin.authorize();
}

// 구글 로그인
function loginGoogle(){
  // 리뉴얼: Firebase 설정 시 실제 구글 로그인 (성공→onAuth 브리지가 handleLoginSuccess 호출)
  if(typeof fbLoginGoogle==='function' && typeof fbConfigured==='function' && fbConfigured()){
    fbLoginGoogle().catch(function(){ showGpsToast('로그인에 실패했어요.'); });
    return;
  }
  if(typeof google==='undefined'||!google.accounts){
    handleLoginSuccess({id:'google_'+Date.now(),name:'수락이',email:'surak@gmail.com',provider:'google',avatar:null});
    return;
  }
  google.accounts.id.initialize({
    client_id:LOGIN_CONFIG.google.clientId,
    callback:function(response){
      var payload=JSON.parse(atob(response.credential.split('.')[1]));
      handleLoginSuccess({
        id:'google_'+payload.sub,name:payload.name,
        email:payload.email,provider:'google',avatar:payload.picture
      });
    }
  });
  google.accounts.id.prompt();
}

function handleLoginSuccess(user){
  saveUser(user);
  closeLoginPopup();
  // EXP 보너스 (첫 로그인)
  var firstLogin=localStorage.getItem('surak_first_login');
  if(!firstLogin){
    localStorage.setItem('surak_first_login','1');
    addExp(EXP_EVENTS.first_login,{KO:'첫 로그인 보너스',EN:'First login bonus',JP:'初回ログインボーナス',CN:'首次登录奖励'});
    showGpsToast('+200 EXP 🎉');
  }
  showGpsToast({KO:user.name+'님 환영합니다! 🎉',EN:'Welcome '+user.name+'! 🎉',JP:user.name+'さんようこそ！🎉',CN:'欢迎'+user.name+'！🎉'}[lang]);
  var mi=g('my-inner');if(mi)delete mi.dataset.done;
  renderMy();
}

// 리뉴얼: Firebase 인증 ↔ 앱 사용자 브리지 (Firebase 로그인 시 앱 _user 동기화)
if(typeof fbOnAuth==='function'){
  fbOnAuth(function(u){
    if(!u) return;
    var existing=getUserData(), fid='google_'+u.uid;
    if(!existing || existing.id!==fid){
      handleLoginSuccess({id:fid,name:u.displayName||'수락이',email:u.email||'',provider:'google',avatar:u.photoURL||null});
    } else { _user=existing; }
    fbSyncUser();
  });
}

/* ═══ 배지 16종 ═══ */
var BADGE_DEFS=[
  /* ── 역사 인물 배지 (SD 12개 대응) ── */
  {id:'hist_cheon',grade:'C',cat:'history',icon:'🖊️',nm:{KO:'소풍의 시작',EN:'Picnic Poet',JP:'소풍の詩人',CN:'郊游诗人'},desc:{KO:'천상병 시인 이야기를 읽은 유저',EN:'Read poet Cheon Sang-byeong story',JP:'千尚炳詩人の物語を読んだ',CN:'读完了天尚炳诗人的故事'}},
  {id:'hist_kim',grade:'C',cat:'history',icon:'📚',nm:{KO:'매월당의 붓',EN:'Maewoldang Brush',JP:'梅月堂の筆',CN:'梅月堂之笔'},desc:{KO:'김시습의 금오신화 이야기를 읽은 유저',EN:'Read Kim Si-seup story',JP:'金時習の物語を読んだ',CN:'读完了金时习的故事'}},
  {id:'hist_queen',grade:'C',cat:'history',icon:'🌙',nm:{KO:'인현왕후의 달빛',EN:'Queen\'s Moonlight',JP:'王后の月明かり',CN:'王后月光'},desc:{KO:'인현왕후와 장희빈 이야기를 읽은 유저',EN:'Read Queen Inhyeon story',JP:'仁顕王后の物語を読んだ',CN:'读完了仁显王后的故事'}},
  {id:'hist_park',grade:'C',cat:'history',icon:'📖',nm:{KO:'수락산 예찬론자',EN:'Suraksan Devotee',JP:'スラクサン礼賛者',CN:'水落山礼赞者'},desc:{KO:'박세당의 수락산 예찬 이야기를 읽은 유저',EN:'Read Park Se-dang story',JP:'朴世堂の物語を読んだ',CN:'读完了朴世堂的故事'}},
  {id:'hist_hwang',grade:'C',cat:'history',icon:'🏛️',nm:{KO:'물소리의 재상',EN:'Minister of Waters',JP:'水音の宰相',CN:'水声宰相'},desc:{KO:'황희 정승의 수락산 이야기를 읽은 유저',EN:'Read Minister Hwang Hee story',JP:'黄喜政丞の物語を読んだ',CN:'读完了黄喜政丞的故事'}},
  {id:'hist_lee',grade:'C',cat:'history',icon:'⚔️',nm:{KO:'반역산의 건국자',EN:'Founder of Rebel Mt.',JP:'逆賊山の建国者',CN:'逆贼山建国者'},desc:{KO:'이성계와 반역산 이야기를 읽은 유저',EN:'Read Yi Seonggye story',JP:'李成桂の物語を読んだ',CN:'读完了李成桂的故事'}},
  {id:'hist_jeongjo',grade:'R',cat:'history',icon:'🏯',nm:{KO:'백일기도의 기적',EN:'Miracle of 100 Days',JP:'百日祈祷の奇跡',CN:'百日祈祷奇迹'},desc:{KO:'정조 대왕의 내원암 기도 이야기를 읽은 유저',EN:'Read King Jeongjo prayer story',JP:'正祖の祈祷物語を読んだ',CN:'读完了正祖祈祷的故事'}},
  {id:'hist_yeonsan',grade:'R',cat:'history',icon:'🔥',nm:{KO:'폭군의 사냥터',EN:'Tyrant\'s Hunting Ground',JP:'暴君の狩猟場',CN:'暴君猎场'},desc:{KO:'연산군과 수락산 민초 이야기를 읽은 유저',EN:'Read Yeonsangun story',JP:'燕山君の物語を読んだ',CN:'读完了燕山君的故事'}},
  {id:'hist_heungseon',grade:'R',cat:'history',icon:'🖌️',nm:{KO:'야망의 베이스캠프',EN:'Ambition Base Camp',JP:'野望のベースキャンプ',CN:'野心大本营'},desc:{KO:'흥선대원군의 수락산 이야기를 읽은 유저',EN:'Read Heungseon Daewongun story',JP:'興宣大院君の物語を読んだ',CN:'读完了兴宣大院君的故事'}},
  {id:'hist_jeong',grade:'R',cat:'history',icon:'🎨',nm:{KO:'진경의 붓질',EN:'Jingyeong Brushstroke',JP:'真景の筆遣い',CN:'真景笔触'},desc:{KO:'겸재 정선의 수락산 그림 이야기를 읽은 유저',EN:'Read Jeong Seon story',JP:'謙斎鄭敾の物語を読んだ',CN:'读完了谦斋郑敾的故事'}},
  {id:'hist_eom',grade:'R',cat:'history',icon:'🕯️',nm:{KO:'충의의 밤',EN:'Night of Loyalty',JP:'忠義の夜',CN:'忠义之夜'},desc:{KO:'엄흥도와 김시습의 비밀 야화를 읽은 유저',EN:'Read the secret tale of Eom & Kim',JP:'厳興道と金時習の夜話を読んだ',CN:'读完了严兴道与金时习的夜话'}},
  {id:'hist_misc',grade:'R',cat:'history',icon:'🐯',nm:{KO:'수락산의 전설들',EN:'Legends of Suraksan',JP:'スラクサンの伝説',CN:'水落山的传说'},desc:{KO:'호랑이·김삿갓·한석봉 야화를 읽은 유저',EN:'Read the tales of tiger, Kim Satgat & Han',JP:'虎・金笠・韓石峯の夜話を読んだ',CN:'读完了老虎·金笠·韩石峯的夜话'}},
  {id:'hist_master',grade:'E',cat:'history',icon:'👑',nm:{KO:'수락산 역사가',EN:'Suraksan Historian',JP:'スラクサン歴史家',CN:'水落山历史学家'},desc:{KO:'수락산 12인의 이야기를 모두 마스터한 탐험가',EN:'Mastered all 12 Suraksan legends',JP:'12人の物語をすべてマスター',CN:'掌握了全部12位历史人物故事'}},
  {id:'hike_first',grade:'C',cat:'hiking',icon:'🚶',nm:{KO:'첫걸음마',EN:'First Steps',JP:'初めの一歩',CN:'第一步'},desc:{KO:'수락 스트릿 탐험을 시작한 유저',EN:'Started exploring Surak Street',JP:'スラクストリートの探険を開始',CN:'开始探索水落街'}},
  {id:'hike_morning',grade:'C',cat:'hiking',icon:'🌅',nm:{KO:'아침의 싱그러움',EN:'Morning Freshness',JP:'朝の清々しさ',CN:'清晨的清新'},desc:{KO:'이른 아침 거리를 활기차게 만든 유저',EN:'Energized the street in early morning',JP:'早朝に通りを活気づかせた',CN:'在清晨为街道注入活力'}},
  {id:'hike_weekend',grade:'R',cat:'hiking',icon:'⛰️',nm:{KO:'주말의 정복자',EN:'Weekend Conqueror',JP:'週末の征服者',CN:'周末征服者'},desc:{KO:'주말 풀코스를 주파한 프로 등산러',EN:'Completed the full weekend course',JP:'週末フルコースを走破',CN:'完成周末全程的登山者'}},
  {id:'hike_iron',grade:'E',cat:'hiking',icon:'🏆',nm:{KO:'철인 수락',EN:'Iron Surak',JP:'鉄人スラク',CN:'铁人水落'},desc:{KO:'꾸준한 완등으로 성실함을 증명',EN:'Proven dedication through consistent summits',JP:'継続的な完登で誠実さを証明',CN:'通过持续完登证明毅力'}},
  {id:'food_explorer',grade:'C',cat:'gourmet',icon:'🍽️',nm:{KO:'수락 미식가',EN:'Surak Foodie',JP:'スラク美食家',CN:'水落美食家'},desc:{KO:'다양한 제휴 매장을 골고루 탐방',EN:'Explored various partner stores',JP:'様々な提携店舗を幅広く探訪',CN:'广泛探访各合作店铺'}},
  {id:'food_cafe',grade:'C',cat:'gourmet',icon:'☕',nm:{KO:'카페인 중독',EN:'Caffeine Addict',JP:'カフェイン中毒',CN:'咖啡因上瘾'},desc:{KO:'카페 매장을 집중적으로 이용한 유저',EN:'Intensively visited cafe stores',JP:'カフェ店舗を集中的に利用',CN:'集中光顾咖啡馆'}},
  {id:'food_regular',grade:'R',cat:'gourmet',icon:'🤝',nm:{KO:'단골손님',EN:'Regular Customer',JP:'常連客',CN:'老顾客'},desc:{KO:'한 매장을 깊게 파고든 의리파 유저',EN:'Deeply loyal to a single store',JP:'一店舗を深く掘り下げた義理派',CN:'深度忠诚于一家店铺'}},
  {id:'food_vip',grade:'E',cat:'gourmet',icon:'👑',nm:{KO:'스트릿 인플루언서',EN:'Street Influencer',JP:'ストリートインフルエンサー',CN:'街道达人'},desc:{KO:'상권 내 모든 업종을 섭렵한 VVIP',EN:'Conquered all store categories',JP:'商圏内全業種を制覇したVVIP',CN:'征服街区所有业态的VVIP'}},
  {id:'night_stroll',grade:'C',cat:'night',icon:'🌙',nm:{KO:'밤소풍의 낭만',EN:'Night Stroll Romance',JP:'夜のピクニックの浪漫',CN:'夜游的浪漫'},desc:{KO:'야간 디자인 거리의 정취를 즐긴 유저',EN:'Enjoyed the night ambiance',JP:'夜のデザイン通りの情趣を楽しんだ',CN:'享受夜间设计街氛围'}},
  {id:'night_music',grade:'C',cat:'night',icon:'🎵',nm:{KO:'그루브 리스너',EN:'Groove Listener',JP:'グルーブリスナー',CN:'律动听众'},desc:{KO:'사운드 탭 음악을 들으며 거리를 산책',EN:'Strolled with Sound tab music',JP:'サウンドタブの音楽を聴きながら散歩',CN:'边听音乐标签边漫步街道'}},
  {id:'night_owl',grade:'R',cat:'night',icon:'🦉',nm:{KO:'올빼미 크루',EN:'Owl Crew',JP:'フクロウクルー',CN:'猫头鹰小队'},desc:{KO:'주말 야간 상권에 활력을 불어넣은 크루',EN:'Energized district on weekend nights',JP:'週末夜間商圏に活力を与えたクルー',CN:'为周末夜间街区注入活力'}},
  {id:'night_legend',grade:'E',cat:'night',icon:'✨',nm:{KO:'빛의 인도자',EN:'Guide of Light',JP:'光の道案内',CN:'光之引路人'},desc:{KO:'밤 시간대 모든 미션을 섭렵한 야간 지배자',EN:'Conquered all night missions',JP:'夜間のすべてのミッションを制覇',CN:'征服夜间所有任务的霸主'}}
];

function getStoreVisits(){try{return JSON.parse(localStorage.getItem('surak_store_visits')||'{}');}catch(e){return {};}}
function recordStoreVisit(storeId){var d=getStoreVisits();d[storeId]=(d[storeId]||0)+1;try{localStorage.setItem('surak_store_visits',JSON.stringify(d));}catch(e){}checkStoreBadge(storeId,d[storeId]);return d[storeId];}
function getVisitBadgeGrade(count){if(count>=10)return{grade:'diamond',icon:'💎',nm:{KO:'매장 수호신',EN:'Store Guardian',JP:'店舗守護神',CN:'店铺守护神'},color:'#4A90D9'};if(count>=5)return{grade:'gold',icon:'🥇',nm:{KO:'아지트 크루',EN:'Aizit Crew',JP:'アジトクルー',CN:'据点成员'},color:'#FFD700'};if(count>=3)return{grade:'silver',icon:'🥈',nm:{KO:'단골 인증',EN:'Regular',JP:'常連認証',CN:'老顾客认证'},color:'#C0C0C0'};if(count>=1)return{grade:'bronze',icon:'🥉',nm:{KO:'신규 탐험가',EN:'New Explorer',JP:'新規探険者',CN:'新访客'},color:'#CD7F32'};return null;}
function checkStoreBadge(id,count){var g=getVisitBadgeGrade(count);if(g)showGpsToast(g.icon+' '+(g.nm[lang]||g.nm.KO));}
function getBadgeState(){try{return JSON.parse(localStorage.getItem('surak_badges')||'{}');}catch(e){return {};}}
function saveBadgeState(d){try{localStorage.setItem('surak_badges',JSON.stringify(d));}catch(e){}}
function unlockBadge(id){
  var data=getBadgeState();if(data[id])return false;
  data[id]={unlockedAt:new Date().toLocaleDateString('ko-KR')};saveBadgeState(data);
  var badge=BADGE_DEFS.find(function(b){return b.id===id;});
  if(badge){
    addExp(badge.grade==='C'?50:badge.grade==='R'?150:300,badge.nm);
    var gn={C:{KO:'일반',EN:'Common',JP:'コモン',CN:'普通'},R:{KO:'희귀',EN:'Rare',JP:'レア',CN:'稀有'},E:{KO:'전설',EN:'Epic',JP:'エピック',CN:'传说'}};
    showGpsToast(badge.icon+' '+(badge.nm[lang]||badge.nm.KO)+' ['+(gn[badge.grade][lang]||gn[badge.grade].KO)+'] '+{KO:'획득!',EN:'Unlocked!',JP:'獲得！',CN:'获得！'}[lang]);
  }
  return true;
}
function checkTimeBadges(){var hr=new Date().getHours(),isWE=new Date().getDay()===0||new Date().getDay()===6;if(hr<7)unlockBadge('hike_morning');if(hr>=21)unlockBadge('night_stroll');if(isWE&&hr>=22)unlockBadge('night_owl');if(!localStorage.getItem('surak_first_run')){localStorage.setItem('surak_first_run','1');unlockBadge('hike_first');}}
function checkGourmetBadges(){var visits=getStoreVisits();var ids=Object.keys(visits).map(Number);var visited=STORES.filter(function(s){return ids.indexOf(s.id)>=0;});if(visited.length>=3)unlockBadge('food_explorer');if(visited.filter(function(s){return s.cat==='cafe';}).length>=3)unlockBadge('food_cafe');if(['food','cafe','gogi','bar'].every(function(c){return visited.some(function(s){return s.cat===c;});}))unlockBadge('food_vip');if(Object.values(visits).some(function(v){return v>=3;}))unlockBadge('food_regular');}
function checkHikingBadges(){var data=getExpData();var cnt=(data.history||[]).filter(function(r){return typeof r.reason==='string'&&r.reason.indexOf('등산')>=0;}).length;if(cnt>=5)unlockBadge('hike_iron');if(new Date().getDay()===0||new Date().getDay()===6)unlockBadge('hike_weekend');}
function checkNightBadges(){var bs=getBadgeState();if(['night_stroll','night_music','night_owl'].every(function(id){return bs[id];}))unlockBadge('night_legend');}
function checkHistoryBadges(){
  var ids=['cheon','kim','queen','park','hwang','lee','jeongjo','yeonsan','heungseon','jeong','eom','misc'];
  ids.forEach(function(k){if(localStorage.getItem('surak_hist_'+k))unlockBadge('hist_'+k);});
  var bs=getBadgeState();
  if(ids.every(function(k){return bs['hist_'+k];}))unlockBadge('hist_master');
}
function checkMusicBadge(){if(parseInt(localStorage.getItem('surak_play_time')||'0')>=600)unlockBadge('night_music');}
function renderDokkam(el){
  if(!el)return;
  var visits=getStoreVisits();var L=function(o){return o[lang]||o.KO;};var h='';
  var visited=STORES.filter(function(s){return visits[s.id]>0;});
  if(visited.length===0){h+='<div style="text-align:center;padding:20px;background:var(--sf);border-radius:var(--r3);border:1px solid var(--bd);"><div style="font-size:28px;margin-bottom:6px;">🏪</div><div style="font-size:12px;color:var(--t3);">'+L({KO:'아직 방문한 매장이 없어요. 지도에서 매장을 탭해보세요!',EN:'No stores visited yet. Tap a store on the map!',JP:'まだ訪問した店舗はありません。',CN:'还没有访问过任何店铺。'})+'</div></div>';}
  else{h+='<div style="display:flex;flex-direction:column;gap:6px;">';visited.forEach(function(s){var count=visits[s.id]||0;var grade=getVisitBadgeGrade(count);var nm=lang==='EN'?s.en:lang==='JP'?s.jp:lang==='CN'?s.cn:s.ko;h+='<div style="background:var(--sf);border:1.5px solid '+(grade?grade.color:'var(--bd)')+';border-radius:var(--r2);padding:10px 12px;display:flex;align-items:center;gap:10px;"><div style="font-size:20px;">'+(grade?grade.icon:'🏠')+'</div><div style="flex:1;"><div style="font-size:13px;font-weight:700;color:var(--t1);">'+nm+'</div><div style="font-size:11px;color:var(--t3);">'+count+L({KO:'회 방문',EN:' visits',JP:'回訪問',CN:'次到访'})+(grade?' · '+(grade.nm[lang]||grade.nm.KO):'')+'</div></div><div style="display:flex;gap:2px;">';for(var i=0;i<Math.min(count,5);i++)h+='<div style="width:6px;height:6px;border-radius:50%;background:'+(grade?grade.color:'var(--ac)')+'"></div>';h+='</div></div>';});h+='</div>';var left=STORES.length-visited.length;if(left>0)h+='<div style="font-size:11px;color:var(--t3);text-align:center;margin-top:8px;">'+L({KO:'아직 '+left+'개 매장을 방문하지 않았어요',EN:left+' stores left to visit',JP:'まだ'+left+'店舗を訪問していません',CN:'还有'+left+'家店铺未访问'})+'</div>';}
  el.innerHTML=h;
}

/* ═══ 스토리 모달 ═══ */
var _sTab=0,_sSw={x:0,on:false,si:0};
function openStoryModal(idx){
  var modal=document.getElementById('story-modal');if(!modal)return;
  _sTab=idx||0;
  _buildStory();
  modal.style.display='flex';
  setTimeout(function(){modal.classList.add('on');},10);
}
function closeStoryModal(){
  var modal=document.getElementById('story-modal');if(!modal)return;
  modal.classList.remove('on');
  setTimeout(function(){modal.style.display='none';},300);
}
function _buildStory(){
  var L=function(o){return o[lang]||o.KO;};
  var tabs=document.getElementById('sm-tabs'),wrap=document.getElementById('sm-sw');
  if(!tabs||!wrap)return;
  tabs.innerHTML='';
  SD.forEach(function(s,i){
    var btn=document.createElement('div');btn.className='sm-tab'+(i===_sTab?' on':'');
    btn.textContent=L(s.tab);btn.onclick=function(){_switchTab(i);};tabs.appendChild(btn);
  });
  wrap.innerHTML='';wrap.style.transform='translateX(-'+(_sTab*100)+'%)';
  var _ill2=['https://machojang-create.github.io/surak-demo/cheon.png','https://machojang-create.github.io/surak-demo/kimsiseup.png','https://machojang-create.github.io/surak-demo/inhyeon.png','https://machojang-create.github.io/surak-demo/parksedang.png','https://machojang-create.github.io/surak-demo/hwanghui.png','https://machojang-create.github.io/surak-demo/leeseonggye.png','https://machojang-create.github.io/surak-demo/leehwang.png','https://machojang-create.github.io/surak-demo/yeonsangun.png','https://machojang-create.github.io/surak-demo/heungseon.png','https://machojang-create.github.io/surak-demo/jeongseon.png','https://machojang-create.github.io/surak-demo/eomheungdo.png','https://machojang-create.github.io/surak-demo/kimsatgat.png','https://machojang-create.github.io/surak-demo/jeongjo.png','https://machojang-create.github.io/surak-demo/deokhye.png','https://machojang-create.github.io/surak-demo/hanseokbong.png','https://machojang-create.github.io/surak-demo/seonjo.png'];
  SD.forEach(function(s,si){
    var story=document.createElement('div');
    story.className='sm-story';

    /* ── 이미지 배경 (완전 고정) ── */
    var illDiv=document.createElement('div');
    illDiv.className='sm-illust';
    var illSrc=_ill2[si]||'';
    if(illSrc){
      illDiv.style.backgroundImage='url('+illSrc+')';
      illDiv.style.backgroundColor='#080C14';
    } else {
      illDiv.style.background=s.bg;
      illDiv.style.fontSize='80px';
      illDiv.style.display='flex';
      illDiv.style.alignItems='center';
      illDiv.style.justifyContent='center';
      illDiv.textContent=s.ic;
    }
    /* 이미지 하단 페이드 */
    var fade=document.createElement('div');
    fade.style.cssText='position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to bottom,transparent,#080C14);pointer-events:none;';
    illDiv.appendChild(fade);
    story.appendChild(illDiv);

    /* ── 텍스트 스크롤 레이어 (이미지 위에 absolute) ── */
    var page=document.createElement('div');
    page.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#080C14;margin-top:-24px;border-radius:20px 20px 0 0;';

    /* 이미지 영역 위에 고정, spacer 불필요 */

    /* 텍스트 본문 (반투명 배경) */
    var txtWrap=document.createElement('div');
    txtWrap.style.cssText='background:#080C14;padding:24px 20px 0;';

    /* 인물 이름 + 설명 */
    var nmEl=document.createElement('div');
    nmEl.style.cssText='font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;text-shadow:0 1px 8px rgba(0,0,0,.8);';
    nmEl.textContent=L(s.nm);
    var subEl=document.createElement('div');
    subEl.style.cssText='font-size:12px;color:rgba(255,255,255,.75);margin-bottom:16px;text-shadow:0 1px 4px rgba(0,0,0,.8);';
    subEl.textContent=L(s.sub);

    /* 본문 */
    var bodEl=document.createElement('div');
    bodEl.className='sm-pg-body';
    bodEl.style.cssText='font-size:14px;line-height:1.85;color:rgba(255,255,255,.92);text-shadow:0 1px 3px rgba(0,0,0,.6);';
    bodEl.innerHTML=(L(s.body)).replace(/\n/g,'<br><br>');

    txtWrap.appendChild(nmEl);
    txtWrap.appendChild(subEl);
    txtWrap.appendChild(bodEl);
    page.appendChild(txtWrap);

    /* ── CTA 버튼 ── */
    var cta=document.createElement('div');
    cta.style.cssText='background:#080C14;padding:12px 20px 24px;flex-shrink:0;';
    var btn=document.createElement('button');
    btn.className='sm-cta-btn locked';btn.id='sm-cta-'+si;
    btn.textContent=L({KO:'끝까지 읽으면 EXP 획득!',EN:'Read all to earn EXP!',JP:'最後まで読むとEXP獲得！',CN:'读完获取EXP！'});
    btn.onclick=function(){_onCTA(si);};
    cta.appendChild(btn);
    page.appendChild(cta);

    /* PC 마우스 휠 스크롤 지원 */
    page.addEventListener('wheel',function(e){
      e.preventDefault();
      this.scrollTop+=e.deltaY;
    },{passive:false});
    /* 스크롤 끝 감지 */
    page.addEventListener('scroll',function(){
      if(this.scrollTop+this.clientHeight>=this.scrollHeight-20){
        var ctaEl=document.getElementById('sm-cta-'+si);
        if(ctaEl&&ctaEl.classList.contains('locked')){
          ctaEl.className='sm-cta-btn ready';
          ctaEl.textContent=L({KO:'배지 획득 + EXP 받기! ⚡',EN:'Claim Badge + EXP! ⚡',JP:'バッジ獲得+EXP！',CN:'获取徽章+EXP！'});
        }
      }
    });

    story.appendChild(page);
    wrap.appendChild(story);
  });
}
function _switchTab(i){
  _sTab=i;
  var w=document.getElementById('sm-sw');if(w)w.style.transform='translateX(-'+(i*100)+'%)';
  var t=document.getElementById('sm-tabs');if(t)t.querySelectorAll('.sm-tab').forEach(function(b,ti){b.classList.toggle('on',ti===i);});
}
function _onCTA(si){
  var s=SD[si];var L=function(o){return o[lang]||o.KO;};
  localStorage.setItem('surak_hist_'+s.badge.replace('hist_',''),'1');
  if(typeof unlockBadge==='function')unlockBadge(s.badge);
  var modal=document.getElementById('story-modal');
  if(modal){for(var i=0;i<10;i++){var p=document.createElement('div');p.className='sm-ptc';p.style.background=s.color;p.style.left=(20+Math.random()*60)+'%';p.style.bottom='60px';p.style.animationDelay=(Math.random()*0.3)+'s';modal.appendChild(p);setTimeout(function(el){el.remove();},1000,p);}}
  var cta=document.getElementById('sm-cta-'+si);
  if(cta){cta.className='sm-cta-btn done';cta.textContent='&#x2705; '+L({KO:'획득 완료!',EN:'Claimed!',JP:'獲得完了！',CN:'已获取！'});}
  if(typeof checkHistoryBadges==='function')checkHistoryBadges();
  if(!window._cpEvt){window._cpEvt=true;
    document.addEventListener('click',function(e){
      var card=e.target.closest('[data-cpid]');
      if(card){e.stopPropagation();openCouponModal(card.getAttribute('data-cpid'));}
    });
  }
  /* 게임 배너 전역 이벤트 위임 - 한 번만 등록 */
  if(!window._gameEvtRegistered){
    window._gameEvtRegistered=true;
    document.addEventListener('click',function(e){
      var card=e.target.closest('[data-gameid]');
      if(card){
        e.stopPropagation();
        /* openGameModal이 정의된 후 호출 보장 */
        if(typeof openGameModal==='function'){
          openGameModal(card.getAttribute('data-gameid'));
        } else {
          setTimeout(function(){
            if(typeof openGameModal==='function')
              openGameModal(card.getAttribute('data-gameid'));
          },200);
        }
      }
    });
  }
  var gi=document.getElementById('goods-inner');if(gi)delete gi.dataset.done;
}

var _mapGpsOn=false;
function toggleMapGPS(){
  _mapGpsOn=!_mapGpsOn;
  var btn=document.getElementById('gps-track-btn');
  if(btn){btn.style.background=_mapGpsOn?'var(--ac)':'var(--sf)';}
  if(_mapGpsOn){
    moveToMyLocation();
    showGpsToast({KO:'GPS 추적 ON',EN:'GPS ON',JP:'GPS ON',CN:'GPS ON'}[lang]);
  }else{
    if(typeof _myMarker!=='undefined'&&_myMarker)_myMarker.setMap(null);
    showGpsToast({KO:'GPS 추적 OFF',EN:'GPS OFF',JP:'GPS OFF',CN:'GPS OFF'}[lang]);
  }
}

/* ═══ 배지 도감 UI ═══ */
var _CAT_INFO={
  history:{ic:'📜',nm:{KO:'역사 & 스토리',EN:'History & Story',JP:'歴史＆ストーリー',CN:'历史与故事'}},
  hiking: {ic:'⛰️',nm:{KO:'등산 & 웰니스',EN:'Hiking & Wellness',JP:'登山＆ウェルネス',CN:'登山与健康'}},
  gourmet:{ic:'🍽️',nm:{KO:'미식 & 상권 탐방',EN:'Gourmet & Street',JP:'グルメ＆街探訪',CN:'美食与街区'}},
  night:  {ic:'🌙',nm:{KO:'야간 & 감성',EN:'Night & Ambience',JP:'夜間＆感性',CN:'夜间与感性'}}
};
var _GRADE_NM={
  C:{KO:'일반',EN:'COMMON',JP:'コモン',CN:'普通'},
  R:{KO:'희귀',EN:'RARE',JP:'レア',CN:'稀有'},
  E:{KO:'전설',EN:'EPIC',JP:'エピック',CN:'传说'}
};
var _GRADE_COLOR={C:'#9CA3AF',R:'#60A5FA',E:'#F59E0B'};

function renderBadgeSection(container){
  if(!container)return;
  var L=function(o){return o[lang]||o.KO;};
  var bs=getBadgeState();
  var unlocked=BADGE_DEFS.filter(function(b){return bs[b.id];}).length;
  var h='<div class="badge-section">';
  // 수집 현황
  h+='<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r3);padding:12px 14px;margin-bottom:4px;display:flex;align-items:center;gap:12px;box-shadow:var(--s1);">';
  h+='<div style="font-size:28px;">🏅</div>';
  h+='<div style="flex:1;"><div style="font-size:13px;font-weight:800;color:var(--t1);">'+L({KO:'배지 도감',EN:'Badge Collection',JP:'バッジ図鑑',CN:'徽章图鉴'})+'</div>';
  h+='<div style="font-size:11px;color:var(--t3);margin-top:2px;">'+unlocked+'/16 '+L({KO:'수집',EN:'collected',JP:'収集',CN:'已收集'})+'</div>';
  h+='<div style="height:3px;background:var(--bd);border-radius:2px;margin-top:6px;">';
  h+='<div style="height:100%;width:'+(unlocked/16*100)+'%;background:var(--ac);border-radius:2px;transition:width .6s;"></div></div></div></div>';
  // 카테고리별 배지
  ['history','hiking','gourmet','night'].forEach(function(cat){
    var ci=_CAT_INFO[cat];
    var catBadges=BADGE_DEFS.filter(function(b){return b.cat===cat;});
    h+='<div class="badge-cat-title">'+ci.ic+' '+L(ci.nm)+'</div>';
    h+='<div class="badge-grid">';
    catBadges.forEach(function(badge){
      var owned=!!bs[badge.id];
      var gc=_GRADE_COLOR[badge.grade];
      h+='<div class="badge-card '+(owned?'unlocked':'locked')+' grade-'+badge.grade+'" data-badge-id="'+badge.id+'">';
      h+='<span class="badge-card-grade">'+(L(_GRADE_NM[badge.grade]))+'</span>';
      h+='<span class="badge-card-ic">'+(owned?badge.icon:'❓')+'</span>';
      h+='<div class="badge-card-nm">'+(owned?L(badge.nm):L({KO:'???',EN:'???',JP:'???',CN:'???'}))+'</div>';
      if(owned&&bs[badge.id].unlockedAt)h+='<div class="badge-card-date">'+bs[badge.id].unlockedAt+'</div>';
      h+='</div>';
    });
    h+='</div>';
  });
  h+='</div>';
  container.innerHTML=h;
  // 클릭 → 상세 팝업
  container.querySelectorAll('.badge-card').forEach(function(card){
    card.addEventListener('click',function(){openBadgeDetail(this.dataset.badgeId);});
  });
}

function openBadgeDetail(id){
  var badge=BADGE_DEFS.find(function(b){return b.id===id;});
  if(!badge)return;
  var L=function(o){return o[lang]||o.KO;};
  var bs=getBadgeState();
  var owned=!!bs[id];
  var gc=_GRADE_COLOR[badge.grade];
  var pop=document.getElementById('badge-detail-pop');if(!pop)return;
  var ic=document.getElementById('bdp-ic');if(ic)ic.textContent=owned?badge.icon:'❓';
  var grade=document.getElementById('bdp-grade');
  if(grade){grade.textContent=L(_GRADE_NM[badge.grade]);grade.style.color=gc;}
  var nm=document.getElementById('bdp-nm');
  if(nm){nm.textContent=owned?L(badge.nm):L({KO:'미획득 배지',EN:'Locked Badge',JP:'未獲得バッジ',CN:'未获得徽章'});}
  var desc=document.getElementById('bdp-desc');
  if(desc)desc.textContent=L(badge.desc);
  var cond=document.getElementById('bdp-cond');
  if(cond)cond.textContent=L({KO:'획득 조건: ',EN:'Condition: ',JP:'取得条件: ',CN:'获取条件: '})+L(badge.cond||badge.desc);
  var date=document.getElementById('bdp-date');
  if(date)date.textContent=owned&&bs[id].unlockedAt?L({KO:'획득일: ',EN:'Unlocked: ',JP:'取得日: ',CN:'获取日期: '})+bs[id].unlockedAt:'';
  pop.style.display='flex';setTimeout(function(){pop.classList.add('on');},10);
}
function closeBadgeDetail(){
  var pop=document.getElementById('badge-detail-pop');if(!pop)return;
  pop.classList.remove('on');setTimeout(function(){pop.style.display='none';},300);
}

/* ═══ 단골 도감 UI ═══ */
function renderDokkamSection(container){
  if(!container)return;
  var L=function(o){return o[lang]||o.KO;};
  var visits=getStoreVisits();
  var visited=STORES.filter(function(s){return visits[s.id]>0;});
  var h='';
  // 헤더
  h+='<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r3);padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;box-shadow:var(--s1);">';
  h+='<div style="font-size:28px;">🏪</div>';
  h+='<div style="flex:1;"><div style="font-size:13px;font-weight:800;color:var(--t1);">'+L({KO:'단골 도감',EN:'Store Records',JP:'常連図鑑',CN:'老顾客图鉴'})+'</div>';
  h+='<div style="font-size:11px;color:var(--t3);margin-top:2px;">'+visited.length+'/'+STORES.length+' '+L({KO:'매장 방문',EN:'stores visited',JP:'店舗訪問',CN:'家店铺已访问'})+'</div>';
  h+='<div style="height:3px;background:var(--bd);border-radius:2px;margin-top:6px;">';
  h+='<div style="height:100%;width:'+(visited.length/STORES.length*100)+'%;background:var(--am);border-radius:2px;transition:width .6s;"></div></div></div></div>';
  if(visited.length===0){
    h+='<div style="text-align:center;padding:24px;background:var(--sf);border-radius:var(--r3);border:1px solid var(--bd);">';
    h+='<div style="font-size:36px;margin-bottom:8px;">🏪</div>';
    h+='<div style="font-size:13px;color:var(--t3);">'+L({KO:'지도 탭에서 매장을 탭하면 방문 기록이 쌓여요!',EN:'Tap stores on the map to build your records!',JP:'地図タブで店舗をタップすると記録が積まれます！',CN:'在地图标签点击店铺即可积累记录！'})+'</div></div>';
  }else{
    visited.sort(function(a,b){return (visits[b.id]||0)-(visits[a.id]||0);});
    visited.forEach(function(s){
      var count=visits[s.id]||0;
      var grade=getVisitBadgeGrade(count);
      var nm=lang==='EN'?s.en:lang==='JP'?s.jp:lang==='CN'?s.cn:s.ko;
      var col=grade?grade.color:'var(--bd)';
      var maxPips=10; var fillPips=Math.min(count,maxPips);
      h+='<div class="dokkam-card">';
      h+='<div class="dokkam-grade-bar" style="background:'+col+'"></div>';
      h+='<div class="dokkam-ic">'+(grade?grade.icon:'🏠')+'</div>';
      h+='<div class="dokkam-info">';
      h+='<div class="dokkam-nm">'+nm+'</div>';
      if(grade)h+='<div class="dokkam-grade-nm" style="color:'+col+';">'+(grade.nm[lang]||grade.nm.KO)+'</div>';
      h+='<div class="dokkam-cnt">'+count+L({KO:'회 방문',EN:' visits',JP:'回訪問',CN:'次到访'})+'</div>';
      h+='<div class="dokkam-pips">';
      for(var i=0;i<maxPips;i++)h+='<div class="dokkam-pip'+(i<fillPips?' fill':'')+'"'+(i<fillPips?' style="background:'+col+';"':'')+'""></div>';
      h+='</div></div></div>';
    });
    var left=STORES.length-visited.length;
    if(left>0)h+='<div style="text-align:center;font-size:11px;color:var(--t3);padding:10px;">'+L({KO:'아직 '+left+'개 매장을 방문하지 않았어요',EN:left+' stores left to discover',JP:'まだ'+left+'店舗を訪問していません',CN:'还有'+left+'家店铺未探索'})+'</div>';
  }
  container.innerHTML=h;
}
function applyT(){
  var L=function(o){return o[lang]||o.KO;};

  var tMap=[
    // 탭
    ['t-tab-home',T('navHome')],['t-tab-map',T('tmap')],
    ['t-tab-goods',T('tgoods')],['t-tab-sound',T('tsound')],
    ['t-tab-my',T('navMy')],
    // 헤더
    ['t-app-title',{'KO':'수락 스트릿','EN':'Surak Street','JP':'スラクストリート','CN':'水落街'}[lang]||'수락 스트릿'],
    ['t-app-sub','SURAK STREET'],
    // 홈 - 모드
    ['t-mode-sec',T('homeModeTitle')],
    ['t-mode-walk',T('modeWalk')],['t-mode-walk-ds',T('modeWalkDs')],
    ['t-mode-active',T('modeActive')],['t-mode-active-ds',T('modeActiveDs')],
    ['t-mode-relax',T('modeRelax')],['t-mode-relax-ds',T('modeRelaxDs')],
    // 홈 - 코스
    ['t-today-label','TODAY\'S COURSE'],
    ['t-today-title',T('homeCourseName')],
    ['t-today-time',{'KO':'⏱ 2시간 30분','EN':'⏱ 2.5 hrs','JP':'⏱ 2時間30分','CN':'⏱ 2.5小时'}[lang]],
    ['t-today-level',{'KO':'⚡ 중급','EN':'⚡ Intermediate','JP':'⚡ 中級','CN':'⚡ 中级'}[lang]],
    // 홈 - 핫플/수락이
    ['t-hot-sec',T('homeHotTitle')],
    ['t-surak-msg',T('homeSurakMsg')],
    ['t-surak-sub',T('homeSurakSub')],
    // 지도 패널
    ['t-hero-title',{'KO':'수락 스트릿','EN':'Surak Street','JP':'スラクストリート','CN':'水落街'}[lang]],
    ['map-list-label','📋 '+({'KO':'매장 목록','EN':'Store List','JP':'店舗一覧','CN':'店铺列表'}[lang]||'매장 목록')],
    ['t-banner-name',{'KO':'수락이','EN':'Surak-i','JP':'スラキ','CN':'水落'}[lang]||'수락이'],
    ['t-hero-title',{'KO':'수락 스트릿','EN':'Surak Street','JP':'スラクストリート','CN':'水落街'}[lang]||'수락 스트릿'],
  ];
  tMap.forEach(function(p){se(p[0],p[1]);});
  document.querySelectorAll('.lang-btn').forEach(function(b){b.classList.toggle('on',b.dataset.lang===lang);});
  initCheonBanner();
  var sv2=g('sound-view');if(sv2&&sv2.classList.contains('on'))renderSound();
  // 챗봇 번역
  se('t-chat-name',{KO:'수락이',EN:'Surak-i',JP:'スラキ',CN:'水落'}[lang]||'수락이');
  se('t-chat-sub',{KO:'수락 스트릿 안내봇',EN:'Surak Street Guide',JP:'スラクストリート案内',CN:'水落街导览'}[lang]);
  // 로그인 팝업 번역
  se('t-login-title',{KO:'로그인',EN:'Sign In',JP:'ログイン',CN:'登录'}[lang]);
  se('t-login-sub',{KO:'로그인하면 수집 기록이 저장되고 기기가 바뀌어도 유지됩니다.',EN:'Login to save your collection across all devices.',JP:'ログインでコレクションを保存、機器変更後も維持。',CN:'登录后收藏跨设备保存。'}[lang]);
  var kBtn=g('btn-kakao-popup');if(kBtn)kBtn.textContent=L({KO:'💛 카카오로 로그인',EN:'💛 Login with Kakao',JP:'💛 カカオでログイン',CN:'💛 Kakao登录'});
  var nBtn=g('btn-naver-popup');if(nBtn)nBtn.textContent=L({KO:'🟢 네이버로 로그인',EN:'🟢 Login with Naver',JP:'🟢 ネイバーでログイン',CN:'🟢 Naver登录'});
  var gBtn=g('btn-google-popup');if(gBtn)gBtn.textContent=L({KO:'🔵 구글로 로그인',EN:'🔵 Login with Google',JP:'🔵 Googleでログイン',CN:'🔵 Google登录'});
  se('t-login-skip',{KO:'나중에 하기',EN:'Maybe later',JP:'あとで',CN:'稍后'}[lang]);
  // 레벨업 팝업
  var luBtn=g('lu-confirm-btn');if(luBtn)luBtn.textContent={KO:'확인 ✓',EN:'OK ✓',JP:'確認 ✓',CN:'确认 ✓'}[lang];
  var cinput=g('chat-input');if(cinput)cinput.placeholder={KO:'질문하세요...',EN:'Ask anything...',JP:'質問してください...',CN:'请提问...'}[lang];
  if(_chatOpen)renderChatQuick();
}

/* ═══ 탭 전환 ═══ */
function sv(v){
  document.querySelectorAll('.view').forEach(function(el){el.classList.remove('on');});
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('on');});
  var ve=g(v+'-view');if(ve)ve.classList.add('on');
  var te=document.querySelector('[data-v="'+v+'"]');if(te)te.classList.add('on');
  if(v==='map'){
    renderMapList(); // 매장 리스트는 지도와 무관하게 항상 표시
    var _resize=function(){if(window.naver&&naver.maps&&naver.maps.Event&&_map){try{naver.maps.Event.trigger(_map,'resize');}catch(e){}}};
    if(_mapReady&&!_map){
      _initMap();
    } else if(_map){
      setTimeout(_resize,150);
    } else {
      // 네이버 지도 로딩 대기 (실패 시 리스트만 표시)
      var _mapWait=0;
      var _mapTimer=setInterval(function(){
        _mapWait++;
        if(_mapReady&&!_map){clearInterval(_mapTimer);_initMap();}
        else if(_map){clearInterval(_mapTimer);setTimeout(_resize,150);}
        else if(_mapWait>20)clearInterval(_mapTimer);
      },200);
    }
  }
  if(v==='home')renderHome();
  if(v==='search')renderSearch();
  if(v==='my'){var mi=g('my-inner');if(mi)delete mi.dataset.done;renderMy();}
}

/* ── 수락이(검색) + QR 스캔 — Phase B ── */
function renderSearch(){
  var el=g('search-inner'); if(!el) return;
  if(el.dataset.done) return; el.dataset.done='1';
  var cats=[
    {ic:'☕',label:'근처 카페',q:'cafe'},{ic:'🍚',label:'근처 식당',q:'food'},
    {ic:'🍖',label:'고기집',q:'gogi'},{ic:'🍺',label:'주점',q:'bar'},
    {ic:'🚻',label:'화장실',q:'toilet'},{ic:'🅿️',label:'주차장',q:'parking'},
    {ic:'⛰️',label:'등산 코스',q:'course'},{ic:'📍',label:'정상까지 거리',q:'summit'}
  ];
  var h='<div style="padding:18px 16px;">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><img src="surak/curious.png" style="width:52px;height:52px;border-radius:50%;flex-shrink:0;" alt="수락이"/><div><div style="font-size:18px;font-weight:800;">🔍 수락이</div><div style="font-size:13px;color:var(--t2);">무엇을 찾으세요? 눌러보세요.</div></div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
  cats.forEach(function(c){
    h+='<button onclick="searchQuery(\''+c.q+'\')" style="display:flex;align-items:center;gap:8px;padding:14px;border:1px solid var(--bd);border-radius:var(--r2);background:var(--sf);font-size:14px;font-weight:600;cursor:pointer;text-align:left;"><span style="font-size:20px;">'+c.ic+'</span>'+c.label+'</button>';
  });
  h+='</div><div id="search-result" style="margin-top:18px;"></div></div>';
  el.innerHTML=h;
}
function searchQuery(q){
  var res=g('search-result'); if(!res) return;
  var cat={cafe:'cafe',food:'food',gogi:'gogi',bar:'bar'}[q];
  if(cat){
    var list=(typeof STORES!=='undefined'?STORES:[]).filter(function(s){return s.cat===cat;});
    res.innerHTML='<div style="font-size:13px;color:var(--t3);margin-bottom:8px;">'+list.length+'곳</div>'
      +list.slice(0,20).map(function(s){return '<div onclick="openPopup(STORES.find(function(x){return x.id==='+s.id+';}))" style="padding:12px;border:1px solid var(--bd);border-radius:var(--r2);margin-bottom:8px;cursor:pointer;"><div style="font-weight:700;">'+(s.ko||'')+'</div><div style="font-size:12px;color:var(--t3);">'+(s.addr||'')+'</div></div>';}).join('');
  } else if(q==='course'||q==='summit'){
    res.innerHTML='<div style="padding:14px;background:var(--acbg);border-radius:var(--r2);font-size:14px;">⛰️ 수락산 주봉 코스 8.2km · 약 4시간 (중급)<br/><span style="font-size:12px;color:var(--t2);">지도 탭에서 코스를 확인하세요.</span></div>';
  } else {
    res.innerHTML='<div style="padding:14px;background:var(--bg2);border-radius:var(--r2);font-size:13px;color:var(--t2);">곧 추가될 검색이에요.</div>';
  }
}
function openQrScan(){
  if(typeof showGameConfirm==='function'){
    showGameConfirm('📷 QR 스캔','매장에 부착된 QR 코드를\n폰 카메라로 찍으면 방문 적립됩니다.\n\n(테스트: 1번 매장 적립 시뮬레이션)',function(){
      if(typeof startQrScan==='function') startQrScan(1);
    });
  }
}

/* ═══ 네이버 지도 콜백 ═══ */
window.naverMapInit=function(){
  _mapReady=true;
  if(g('map-view')&&g('map-view').classList.contains('on'))_initMap();
};

/* ═══ 초기화 ═══ */
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.tab').forEach(function(btn){
    btn.addEventListener('click',function(){if(this.dataset.v)sv(this.dataset.v);});
  });
  document.querySelectorAll('.lang-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      lang=this.dataset.lang;
      document.querySelectorAll('.lang-btn').forEach(function(b){b.classList.remove('on');});
      this.classList.add('on');
      var si=g('search-inner');if(si)delete si.dataset.done;
      var mi=g('my-inner');if(mi)delete mi.dataset.done;
      applyT();
      if(_map)_buildMapFilter();
      var cur=document.querySelector('.tab.on');if(!cur)return;
      var v=cur.dataset.v;
      if(v==='home')renderHome();
      else if(v==='search')renderSearch();
      else if(v==='my'){var mi2=g('my-inner');if(mi2)delete mi2.dataset.done;renderMy();}
      else if(v==='info'){var ii2=g('info-inner');if(ii2)delete ii2.dataset.done;renderInfo();}
    });
  });
  var popX=g('pop-x');if(popX)popX.onclick=closePopup;
  var pop=g('pop');if(pop)pop.addEventListener('click',function(e){if(e.target===this)closePopup();});
  var hp=g('home-popup');if(hp)hp.addEventListener('click',function(e){if(e.target===this)closeHomePopup();});
  applyT();
  renderHome();
  // 챗봇 Enter 키
  var chatInput=g('chat-input');
  if(chatInput){chatInput.addEventListener('keydown',function(e){if(e.key==='Enter')sendChat();});}
  setTimeout(function(){showGuideTip();setInterval(showGuideTip,32000);},15000);
});





















function _d(s){return decodeURIComponent(escape(atob(s)));}
function openGameModal(gameId){
  var gd=_GB[gameId];if(!gd)return;
  var ex=document.getElementById('_gModal');if(ex)ex.parentNode.removeChild(ex);
  var ps=document.getElementById('_gStyle');if(ps)ps.parentNode.removeChild(ps);
  var modal=document.createElement('div');
  modal.id='_gModal';
  modal.style.cssText='position:fixed;inset:0;background:#0a0a0a;z-index:9000;display:flex;flex-direction:column;';
  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#111;flex-shrink:0;border-bottom:1px solid #222;';
  hdr.innerHTML='<div style="font-size:14px;font-weight:700;color:#fff;">🎮 '+({'KO':'수락스트릿 미니게임','EN':'Surak Street Mini Game','JP':'スラクストリートミニゲーム','CN':'水落街小游戏'}[lang]||'수락스트릿 미니게임')+' [TEST]</div>'
    +'<button id="_gClose" style="background:rgba(255,255,255,.15);border:none;color:#fff;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;">✕ 닫기</button>';
  modal.appendChild(hdr);
  var body=document.createElement('div');
  body.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;';
  var styleEl=document.createElement('style');
  styleEl.id='_gStyle';
  styleEl.textContent=_d(gd[0]);
  document.head.appendChild(styleEl);
  body.innerHTML=_d(gd[1]);
  modal.appendChild(body);
  document.body.appendChild(modal);
  setTimeout(function(){
    try{(new Function(_d(gd[2])))();}
    catch(e){console.warn('game:',e.message);}
  },80);
  document.getElementById('_gClose').addEventListener('click',function(){
    var s=document.getElementById('_gStyle');if(s)s.parentNode.removeChild(s);
    modal.parentNode.removeChild(modal);
    renderHome();
  });
}
/* ═══ 게임 시스템 끝 ═══ */


/* ═══════════════════════════════════════════════
   수락스트릿 미니게임 & 쿠폰 시스템
═══════════════════════════════════════════════ */

/* ── 게임 포인트 (기존 getPoints/addPoint 활용) ── */
var GAME_KEY_POINTS = 'surak_points'; /* 기존과 동일 */

/* ── 쿠폰 데이터 ── */
var GAME_COUPONS = [
  {id:'drink', ic:'🥤', nm:{KO:'음료 1캔 교환권',EN:'1 Drink',JP:'ドリンク1本',CN:'饮料1罐'}, pt:2000,
   stores:[
     {id:'s1',nm:'오공김밥 수락산점',addr:'동일로242길 55',pin:'1234',color:'#2C4A1E'},
     {id:'s2',nm:'잇츠굿토스트',addr:'동일로242길',pin:'2345',color:'#7B4F2E'},
     {id:'s3',nm:'메가MGC커피',addr:'동일로242길 55',pin:'3456',color:'#1A4A6B'},
   ]},
  {id:'soju', ic:'🥂', nm:{KO:'소주 1병 교환권',EN:'1 Soju',JP:'焼酎1本',CN:'烧酒1瓶'}, pt:5000,
   stores:[
     {id:'s4',nm:'화로화 수락본점',addr:'동일로242길 66',pin:'4567',color:'#8B2A2A'},
     {id:'s5',nm:'오공김밥 수락산점',addr:'동일로242길 55',pin:'1234',color:'#2C4A1E'},
     {id:'s6',nm:'꾸이92포차',addr:'동일로242길 27',pin:'5678',color:'#4A2C6B'},
   ]},
  {id:'beer', ic:'🍺', nm:{KO:'맥주 1캔 교환권',EN:'1 Beer',JP:'ビール1本',CN:'啤酒1罐'}, pt:3000,
   stores:[
     {id:'s7',nm:'화로화 수락본점',addr:'동일로242길 66',pin:'4567',color:'#8B2A2A'},
     {id:'s8',nm:'맥주조아',addr:'동일로242나길 7',pin:'6789',color:'#2A4A8B'},
     {id:'s9',nm:'디오스호프',addr:'동일로242길 30',pin:'7890',color:'#3A5A2A'},
   ]},
];
var GAME_USED_KEY = 'surak_used_cp';
var GAME_EX_KEY   = 'surak_ex_date';

function gameIsUsed(id){
  try{var u=JSON.parse(localStorage.getItem(GAME_USED_KEY)||'[]');return u.indexOf(id)>=0;}catch(e){return false;}
}
function gameMarkUsed(id){
  try{var u=JSON.parse(localStorage.getItem(GAME_USED_KEY)||'[]');if(u.indexOf(id)<0){u.push(id);localStorage.setItem(GAME_USED_KEY,JSON.stringify(u));}}catch(e){}
}
function gameCanEx(){return localStorage.getItem(GAME_EX_KEY)!==new Date().toISOString().slice(0,10);}
function gameMarkEx(){localStorage.setItem(GAME_EX_KEY,new Date().toISOString().slice(0,10));}

/* ── 마이탭 쿠폰 렌더 ── */
function renderMyCoupons(wrap){
  if(!wrap)return;
  var L=function(o){return o[lang]||o.KO;};
  var html='';
  GAME_COUPONS.forEach(function(cp){
    var used=gameIsUsed(cp.id);
    var canBuy=gameCanEx()&&!used&&(getPoints().total||0)>=cp.pt;
    html+='<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r3);margin-bottom:8px;overflow:hidden;box-shadow:var(--s1);'+(used?'filter:grayscale(.8);opacity:.6;':'')+'">';
    html+='<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;">';
    html+='<div style="font-size:32px;">'+cp.ic+'</div>';
    html+='<div style="flex:1;"><div style="font-size:14px;font-weight:800;color:var(--t1);margin-bottom:2px;">'+L(cp.nm)+'</div>';
    html+='<div style="font-size:12px;color:var(--t3);">'+cp.pt.toLocaleString()+' P · '+cp.stores.length+' '+L({KO:'개 매장',EN:'stores',JP:'店舗',CN:'家店铺'})+'</div></div>';
    if(used){
      html+='<div style="font-size:11px;font-weight:700;color:var(--t3);">✅ 사용완료</div>';
    } else {
      html+='<button data-cpid="'+cp.id+'" style="background:'+(canBuy?'var(--ac)':'var(--t3)')+';color:#fff;border:none;border-radius:var(--r2);padding:7px 12px;font-size:12px;font-weight:700;cursor:'+(canBuy?'pointer':'not-allowed')+';white-space:nowrap;">'+(canBuy?L({KO:'교환',EN:'Exchange',JP:'交換',CN:'兑换'}):(getPoints().total<cp.pt?L({KO:'P부족',EN:'Low P',JP:'P不足',CN:'P不足'}):L({KO:'오늘완료',EN:'Done today',JP:'今日完了',CN:'今日完成'})))+'</button>';
    }
    html+='</div></div>';
  });
  if(!html) html='<div style="padding:16px;text-align:center;font-size:12px;color:var(--t3);">포인트를 모아 쿠폰을 교환하세요!</div>';
  wrap.innerHTML = html;
  /* 관리자 발급 쿠폰(Firestore) 상단 표시 */
  if(typeof FB!=='undefined'&&FB.ready){
    FB.db.collection('coupons').where('visible','==',true).get().then(function(snap){
      if(snap.empty)return;
      var ch='<div style="font-size:12px;font-weight:700;color:var(--t2);margin:4px 0 8px;">🎟️ 매장 쿠폰</div>';
      snap.forEach(function(d){var c=d.data();
        ch+='<div style="background:var(--sf);border:1px dashed var(--ac);border-radius:var(--r3);margin-bottom:8px;padding:12px 14px;display:flex;align-items:center;gap:12px;"><div style="font-size:28px;">'+(c.icon||'🎟️')+'</div><div style="flex:1;"><div style="font-size:14px;font-weight:800;">'+(c.title||'')+'</div><div style="font-size:11px;color:var(--t3);">'+(c.storeName||'전체매장')+(c.desc?(' · '+c.desc):'')+(c.until?(' · ~'+c.until):'')+'</div></div></div>';
      });
      wrap.innerHTML=ch+wrap.innerHTML;
    }).catch(function(){});
  }
  /* 쿠폰 교환 클릭 */
  wrap.querySelectorAll('button[data-cpid]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var cpid=this.getAttribute('data-cpid');
      openCouponModal(cpid);
    });
  });
}

/* ── 쿠폰 모달 ── */
var _activeCp=null, _selStore=null, _pinVal='', _pinTry=0, _tsInt=null;

function openCouponPage(){
  /* 마이탭 쿠폰 섹션으로 스크롤 */
  var el=document.getElementById('my-coupon-wrap');
  if(el) el.scrollIntoView({behavior:'smooth'});
}

function openCouponModal(cpid){
  var cp=null;
  for(var i=0;i<GAME_COUPONS.length;i++){if(GAME_COUPONS[i].id===cpid){cp=GAME_COUPONS[i];break;}}
  if(!cp)return;
  var L=function(o){return o[lang]||o.KO;};
  /* 포인트/일일 체크는 직원확인 단계에서 처리 */
  _activeCp=cp; _selStore=null;

  /* 모달 생성 */
  var existing=document.getElementById('_gameCpModal');
  if(existing) existing.parentNode.removeChild(existing);

  var modal=document.createElement('div');
  modal.id='_gameCpModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:flex-end;justify-content:center;';

  var storeHtml='';
  cp.stores.forEach(function(s){
    storeHtml+='<div data-sid="'+s.id+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r2);margin-bottom:6px;cursor:pointer;">'
      +'<div style="width:8px;height:8px;border-radius:50%;background:'+s.color+';flex-shrink:0;"></div>'
      +'<div style="flex:1;"><div style="font-size:13px;font-weight:600;">'+s.nm+'</div>'
      +'<div style="font-size:10px;color:var(--t3);">'+s.addr+'</div></div>'
      +'<div style="font-size:12px;color:var(--t3);">›</div></div>';
  });

  modal.innerHTML='<div style="background:var(--sf);border-radius:24px 24px 0 0;width:100%;max-width:430px;padding:20px 20px 40px;max-height:88vh;overflow-y:auto;">'
    +'<div style="width:40px;height:4px;background:var(--bd);border-radius:2px;margin:0 auto 16px;"></div>'
    +'<div style="background:linear-gradient(135deg,#1a3a5c,#0d1f3c);border-radius:12px;padding:16px;color:#fff;margin-bottom:16px;position:relative;overflow:hidden;">'
    +'<div id="_cpWm" style="position:absolute;inset:0;opacity:.06;font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;animation:wmMove 4s linear infinite;">수락스트릿 · SURAK STREET · '.repeat(20)+'</div>'
    +'<div style="position:absolute;bottom:8px;right:10px;font-size:11px;font-weight:800;opacity:.6;" id="_cpTs">--:--:--</div>'
    +'<div style="font-size:18px;font-weight:800;position:relative;margin-bottom:4px;">'+cp.ic+' '+L(cp.nm)+'</div>'
    +'<div style="font-size:22px;font-weight:800;position:relative;color:#FFD700;">'+cp.pt.toLocaleString()+' P</div>'
    +'</div>'
    +'<div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:8px;">📍 '+L({KO:'교환 가능 매장 (탭하여 선택)',EN:'Select a store',JP:'店舗を選択',CN:'选择门店'})+'</div>'
    +'<div id="_cpStores">'+storeHtml+'</div>'
    +'<button id="_cpStaffBtn" style="width:100%;padding:14px;border-radius:var(--r3);background:var(--t3);border:none;color:#fff;font-size:15px;font-weight:800;cursor:not-allowed;margin-bottom:8px;margin-top:4px;">📍 '+L({KO:'매장을 먼저 선택해주세요',EN:'Select a store first',JP:'店舗を選択してください',CN:'请先选择门店'})+'</button>'
    +'<button id="_cpCancelBtn" style="width:100%;padding:12px;border-radius:var(--r3);background:transparent;border:1px solid var(--bd);font-size:14px;color:var(--t2);cursor:pointer;">'+L({KO:'닫기',EN:'Close',JP:'閉じる',CN:'关闭'})+'</button>'
    +'</div>';

  document.body.appendChild(modal);

  /* 타임스탬프 */
  function uTs(){var n=new Date(),el=document.getElementById('_cpTs');if(!el)return;var h=n.getHours(),m=n.getMinutes(),s=n.getSeconds();el.textContent=(h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;}
  uTs(); _tsInt=setInterval(uTs,1000);

  /* 배경 클릭 닫기 */
  modal.addEventListener('click',function(e){if(e.target===modal)closeCouponModal();});
  document.getElementById('_cpCancelBtn').addEventListener('click',closeCouponModal);

  /* 매장 선택 */
  document.getElementById('_cpStores').querySelectorAll('[data-sid]').forEach(function(item){
    item.addEventListener('click',function(){
      document.getElementById('_cpStores').querySelectorAll('[data-sid]').forEach(function(x){
        x.style.borderColor='var(--bd)'; x.style.background='var(--sf2)';
      });
      this.style.borderColor='var(--ac)'; this.style.background='rgba(44,74,30,.06)';
      var sid=this.getAttribute('data-sid');
      _activeCp.stores.forEach(function(s){if(s.id===sid)_selStore=s;});
      var sb=document.getElementById('_cpStaffBtn');
      sb.style.background='var(--ac)'; sb.style.cursor='pointer';
      sb.textContent='👨‍💼 '+_selStore.nm+' '+{KO:'직원 확인',EN:'Staff Verify',JP:'スタッフ確認',CN:'员工确认'}[lang];
    });
  });

  /* 직원확인 버튼 */
  document.getElementById('_cpStaffBtn').addEventListener('click',function(){
    if(!_selStore)return;
    if(!gameIsUsed(_activeCp.id)){
      if(!gameCanEx()){showGameAlert('오늘은 이미 쿠폰을 교환했어요!');return;}
      if((getPoints().total||0)<_activeCp.pt){showGameAlert('포인트가 부족해요. 현재: '+(getPoints().total||0)+' P / 필요: '+_activeCp.pt+' P');return;}
      showGameConfirm(_activeCp.ic+' '+L(_activeCp.nm), _activeCp.pt.toLocaleString()+' P를 사용할까요?', function(){
        addPoint(-_activeCp.pt,L(_activeCp.nm)+' 쿠폰 교환','🎟️');
        gameMarkEx();
        openPinModal();
      });
      return;
    }
    openPinModal();
  });
}

function closeCouponModal(){
  if(_tsInt){clearInterval(_tsInt);_tsInt=null;}
  var m=document.getElementById('_gameCpModal');
  if(m)m.parentNode.removeChild(m);
  _activeCp=null;_selStore=null;
}

/* ── PIN 모달 ── */
function openPinModal(){
  var L=function(o){return o[lang]||o.KO;};
  var existing=document.getElementById('_pinModal');
  if(existing)existing.parentNode.removeChild(existing);
  _pinVal='';_pinTry=0;

  var pm=document.createElement('div');
  pm.id='_pinModal';
  pm.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9100;display:flex;align-items:center;justify-content:center;';
  pm.innerHTML='<div style="background:var(--sf);border-radius:20px;width:290px;padding:24px 20px;text-align:center;">'
    +'<div style="font-size:16px;font-weight:800;margin-bottom:4px;">🔒 매장 PIN 확인</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-bottom:16px;line-height:1.5;white-space:pre-line;">'+_selStore.nm+'\n직원이 PIN 4자리를 입력해주세요</div>'
    +'<div style="display:flex;justify-content:center;gap:10px;margin-bottom:12px;" id="_pinDots">'
    +'<div id="_pd0" style="'+_pdStyle()+'"></div><div id="_pd1" style="'+_pdStyle()+'"></div>'
    +'<div id="_pd2" style="'+_pdStyle()+'"></div><div id="_pd3" style="'+_pdStyle()+'"></div>'
    +'</div>'
    +'<div style="font-size:11px;color:#c00;font-weight:700;min-height:16px;margin-bottom:10px;" id="_pinMsg"></div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">'
    +[1,2,3,4,5,6,7,8,9,'del',0,'x'].map(function(k){
      return '<button data-pk="'+k+'" style="height:50px;border-radius:8px;background:var(--sf2);border:1px solid var(--bd);font-size:18px;font-weight:700;cursor:pointer;">'+(k==='del'?'⌫':k==='x'?'✕':k)+'</button>';
    }).join('')
    +'</div>'
    +'<button id="_pinCloseBtn" style="width:100%;padding:11px;border-radius:8px;background:transparent;border:1px solid var(--bd);font-size:13px;color:var(--t2);cursor:pointer;">취소</button>'
    +'</div>';
  document.body.appendChild(pm);
  pm.querySelectorAll('[data-pk]').forEach(function(btn){
    btn.addEventListener('click',function(){_doPIN(this.getAttribute('data-pk'));});
  });
  document.getElementById('_pinCloseBtn').addEventListener('click',closePinModal);
}
function _pdStyle(filled,err){
  return 'width:42px;height:42px;border-radius:8px;background:'+(err?'rgba(139,42,42,.1)':(filled?'var(--ac)':'var(--sf2)'))+';border:2px solid '+(err?'#c00':(filled?'var(--ac)':'var(--bd)'))+';display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;';
}
function _renderPIN(err){
  for(var i=0;i<4;i++){
    var d=document.getElementById('_pd'+i);
    if(!d)return;
    var filled=_pinVal.length>i;
    d.style.cssText=_pdStyle(filled,err);
    d.textContent=filled?'●':'';
  }
}
function _doPIN(k){
  if(k==='x'||k==='del'){_pinVal=_pinVal.slice(0,-1);document.getElementById('_pinMsg').textContent='';}
  else if(/[0-9]/.test(k)&&_pinVal.length<4){
    _pinVal+=k;
    if(_pinVal.length===4)setTimeout(_verifyPIN,150);
  }
  _renderPIN();
}
function _verifyPIN(){
  var L=function(o){return o[lang]||o.KO;};

  if(!_selStore)return;
  if(_pinVal===_selStore.pin){
    closePinModal();
    gameMarkUsed(_activeCp.id);
    /* 사용완료 UI 업데이트 */
    var bg=document.querySelector('#_gameCpModal .use-bg');
    if(bg)bg.style.filter='grayscale(1)';
    var sb=document.getElementById('_cpStaffBtn');
    if(sb){sb.textContent='✅ '+L({KO:'사용 완료',EN:'Used',JP:'使用済み',CN:'已使用'});sb.disabled=true;sb.style.background='var(--t3)';}
    /* 마이탭 쿠폰 다시 렌더 */
    var mw=document.getElementById('my-coupon-wrap');
    if(mw)renderMyCoupons(mw);
    closeCouponModal();
    showGameAlert('✅ 쿠폰 사용 완료!\n즐거운 식사 되세요 🍽️');
  } else {
    _pinTry++;_pinVal='';_renderPIN(true);
    document.getElementById('_pinMsg').textContent=_pinTry>=3?'❌ 3회 오류. 잠시 후 시도하세요.':'❌ PIN 불일치 ('+(3-_pinTry)+'회 남음)';
    if(_pinTry>=3)setTimeout(closePinModal,2000);
  }
}
function closePinModal(){var m=document.getElementById('_pinModal');if(m)m.parentNode.removeChild(m);_pinVal='';}

/* ── 커스텀 Alert/Confirm ── */
function showGameAlert(msg,onOk){
  var d=document.createElement('div');
  d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9200;display:flex;align-items:center;justify-content:center;';
  d.addEventListener('click',function(e){e.stopPropagation();});
  d.innerHTML='<div style="background:var(--sf);border-radius:16px;width:280px;padding:24px 20px;text-align:center;">'
    +'<div style="font-size:14px;color:var(--t1);line-height:1.7;white-space:pre-line;margin-bottom:20px;">'+msg+'</div>'
    +'<button style="width:100%;padding:12px;border-radius:8px;background:var(--ac);border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">확인</button>'
    +'</div>';
  document.body.appendChild(d);
  d.querySelector('button').addEventListener('click',function(){d.parentNode.removeChild(d);if(onOk)onOk();});
}
function showGameConfirm(title,msg,onOk){
  var d=document.createElement('div');
  d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9200;display:flex;align-items:center;justify-content:center;';
  d.innerHTML='<div style="background:var(--sf);border-radius:16px;width:280px;padding:24px 20px;text-align:center;">'
    +'<div style="font-size:15px;font-weight:800;margin-bottom:8px;">'+title+'</div>'
    +'<div style="font-size:13px;color:var(--t2);line-height:1.7;white-space:pre-line;margin-bottom:20px;">'+msg+'</div>'
    +'<div style="display:flex;gap:8px;">'
    +'<button id="_cfCancelBtn" style="flex:1;padding:12px;border-radius:8px;background:transparent;border:1px solid var(--bd);font-size:14px;color:var(--t2);cursor:pointer;">취소</button>'
    +'<button id="_cfOkBtn" style="flex:1;padding:12px;border-radius:8px;background:var(--ac);border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">확인</button>'
    +'</div></div>';
  document.body.appendChild(d);
  d.querySelector('#_cfOkBtn').addEventListener('click',function(){d.parentNode.removeChild(d);if(onOk)onOk();});
  d.querySelector('#_cfCancelBtn').addEventListener('click',function(){d.parentNode.removeChild(d);});
}

/* ── 게임 모달 열기 ── */
/* ═══ 게임 시스템 끝 ═══ */


