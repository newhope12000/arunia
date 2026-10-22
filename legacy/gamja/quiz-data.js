// WEEKMATE: 7 questions, four choices each
const AXES = {"F":"아이디어","T":"분석","I":"실행","E":"조율"};
const QUESTIONS = [
  {
    "scene": "01 · 친구 생일 준비",
    "title": "친구 생일파티를 준비해\n먼저 맡고 싶은 일은?",
    "hint": "딱 하나만 맡는다면 골라줘",
    "options": [
      {
        "title": "깜짝 이벤트 아이디어 내기",
        "p": "F",
        "s": "E"
      },
      {
        "title": "후기와 가격을 보고 장소 고르기",
        "p": "T",
        "s": "F"
      },
      {
        "title": "케이크와 준비물 목록 적기",
        "p": "I",
        "s": "T"
      },
      {
        "title": "친구들에게 가능한 날짜 물어보기",
        "p": "E",
        "s": "I"
      }
    ]
  },
  {
    "scene": "02 · 하루 카페 알바",
    "title": "카페에서 한 가지 일만 맡는다면?",
    "hint": "경험이 없어도, 더 끌리는 일을 골라줘",
    "options": [
      {
        "title": "주문대로 음료 담고 포장하기",
        "p": "I",
        "s": "E"
      },
      {
        "title": "고민하는 손님에게 메뉴 설명하기",
        "p": "E",
        "s": "T"
      },
      {
        "title": "신메뉴 홍보 사진 찍기",
        "p": "F",
        "s": "I"
      },
      {
        "title": "판매 기록에서 인기 메뉴 찾기",
        "p": "T",
        "s": "F"
      }
    ]
  },
  {
    "scene": "03 · 신청자가 없을 때",
    "title": "모임 홍보 글을 올렸는데\n신청자가 없어. 먼저 뭘 할까?",
    "hint": "나중에 할 일 말고, 첫 행동 하나만",
    "options": [
      {
        "title": "지난 홍보 글과 조회 수 비교하기",
        "p": "T",
        "s": "I"
      },
      {
        "title": "글을 본 친구에게 안 온 이유 묻기",
        "p": "E",
        "s": "T"
      },
      {
        "title": "눈길이 가도록 제목 새로 쓰기",
        "p": "F",
        "s": "E"
      },
      {
        "title": "아직 안 올린 단톡방에 공유하기",
        "p": "I",
        "s": "F"
      }
    ]
  },
  {
    "scene": "04 · 여행 의견 충돌",
    "title": "친구들은 바다, 나는 산!\n어떻게 정하면 좋을까?",
    "hint": "내가 먼저 꺼낼 말을 골라줘",
    "options": [
      {
        "title": "“각자 왜 가고 싶은지 얘기해보자”",
        "p": "E",
        "s": "I"
      },
      {
        "title": "“산도 바다도 있는 곳은 어때?”",
        "p": "F",
        "s": "T"
      },
      {
        "title": "“두 곳의 비용부터 비교해보자”",
        "p": "T",
        "s": "E"
      },
      {
        "title": "“투표 올릴게, 오늘 안에 정하자”",
        "p": "I",
        "s": "F"
      }
    ]
  },
  {
    "scene": "05 · 한 시간의 여유",
    "title": "이 중 한 시간 동안 할 일은?",
    "hint": "해야 한다면 가장 덜 지루한 걸 골라줘",
    "options": [
      {
        "title": "여행 사진으로 짧은 영상 만들기",
        "p": "F",
        "s": "I"
      },
      {
        "title": "사진을 날짜별 폴더에 정리하기",
        "p": "I",
        "s": "T"
      },
      {
        "title": "숙소 후기 읽고 장단점 비교하기",
        "p": "T",
        "s": "E"
      },
      {
        "title": "친구의 고민을 듣고 대화하기",
        "p": "E",
        "s": "F"
      }
    ]
  },
  {
    "scene": "06 · 마감 두 시간 전",
    "title": "팀 발표가 두 시간 남았어\n내가 먼저 할 일은?",
    "hint": "다 필요해도, 먼저 할 것 하나만",
    "options": [
      {
        "title": "미완성인 슬라이드부터 채우기",
        "p": "I",
        "s": "T"
      },
      {
        "title": "복잡한 내용을 그림 한 장으로 바꾸기",
        "p": "F",
        "s": "I"
      },
      {
        "title": "팀원들에게 남은 슬라이드 나눠주기",
        "p": "E",
        "s": "F"
      },
      {
        "title": "발표에 쓸 숫자와 출처 확인하기",
        "p": "T",
        "s": "E"
      }
    ]
  },
  {
    "scene": "07 · 듣고 싶은 한마디",
    "title": "팀 활동이 끝났어\n어떤 말이 가장 뿌듯할까?",
    "hint": "칭찬을 하나만 듣는다면 골라줘",
    "options": [
      {
        "title": "“네가 찾아준 자료 덕분에 해결했어”",
        "p": "T",
        "s": "I"
      },
      {
        "title": "“네 아이디어가 제일 기억에 남아”",
        "p": "F",
        "s": "E"
      },
      {
        "title": "“네가 중간에서 얘기해줘서 풀렸어”",
        "p": "E",
        "s": "F"
      },
      {
        "title": "“네가 챙겨줘서 제시간에 끝냈어”",
        "p": "I",
        "s": "T"
      }
    ]
  }
];
const PROFILES = {
  "F": {
    "name": "아이디어가 떠오른 감자",
    "summary": "새로운 이름이나 문구를 생각하고, 직접 만들어보는 선택을 많이 했어",
    "strength": "같은 내용도 다르게 표현하거나, 아직 시도하지 않은 방법을 제안하는 일에 관심이 있어 보여",
    "environment": "내가 생각한 것을 직접 만들고, 사람들의 반응을 보고 수정할 수 있는 곳",
    "jobs": [
      "콘텐츠 기획",
      "브랜드 마케팅",
      "서비스 기획"
    ],
    "reason": "게시물이나 영상의 주제를 정하고, 제품과 서비스를 소개할 방법을 만드는 일을 살펴봐",
    "experiment": "좋아하는 브랜드를 하나 골라 게시물 제목 3개와 각 제목에 어울리는 이미지를 구상해봐\n어떤 걸 만들 때 가장 재미있었는지 적어봐",
    "partner": "아이디어를 실현하는 데 필요한 시간과 준비물을 함께 정리해주는 사람",
    "imageClass": "potato-F",
    "imageAlt": "전구가 떠오른 머리 옆에서 스케치북에 아이디어를 그리는 감자"
  },
  "T": {
    "name": "꼼꼼히 살펴보는 감자",
    "summary": "자료를 비교하고, 왜 그런 결과가 나왔는지 알아보는 선택을 많이 했어",
    "strength": "여러 후기나 수치를 비교해 공통점을 찾고, 판단할 근거를 정리하는 일에 관심이 있어 보여",
    "environment": "필요한 자료를 찾아볼 수 있고, 결정을 내리기 전에 비교할 시간이 있는 곳",
    "jobs": [
      "시장 조사",
      "데이터 분석",
      "마케팅 분석"
    ],
    "reason": "고객 후기나 판매 기록을 살펴보고, 문제의 원인과 개선할 점을 찾는 일을 살펴봐",
    "experiment": "자주 쓰는 앱의 리뷰 20개를 읽고, 비슷한 불만끼리 묶어봐\n가장 먼저 고치면 좋을 점과 그 이유를 한 장으로 정리해봐",
    "partner": "자료에서 찾은 개선점을 실제로 적용하고 결과를 확인해주는 사람",
    "imageClass": "potato-T",
    "imageAlt": "동그란 안경을 쓰고 돋보기로 자료를 살펴보는 감자"
  },
  "I": {
    "name": "하나씩 끝내는 감자",
    "summary": "할 일을 정리하고, 순서대로 마무리하는 선택을 많이 했어",
    "strength": "일정과 준비물을 챙기고, 빠진 일 없이 끝내는 역할에 관심이 있어 보여",
    "environment": "내가 맡은 일과 마감일이 분명하고, 무엇을 먼저 해야 할지 알 수 있는 곳",
    "jobs": [
      "서비스 운영",
      "프로젝트 운영",
      "물류·SCM 운영"
    ],
    "reason": "주문이나 일정을 확인하고, 필요한 준비가 제때 끝나도록 관리하는 일을 살펴봐",
    "experiment": "친구들과의 작은 모임을 정하고 준비물, 예약할 곳, 할 일을 적어봐\n실제로 준비하면서 빠뜨린 일과 다음에 바꾸고 싶은 점을 기록해봐",
    "partner": "더 간단한 방법을 제안하고, 무엇부터 할지 함께 정해주는 사람",
    "imageClass": "potato-I",
    "imageAlt": "체크리스트의 할 일을 하나씩 확인하며 연필로 표시하는 감자"
  },
  "E": {
    "name": "함께 의견을 맞추는 감자",
    "summary": "사람들의 이야기를 듣고, 서로 원하는 것을 맞춰보는 선택을 많이 했어",
    "strength": "상대에게 필요한 것을 물어보고, 의견이 다를 때 함께할 방법을 찾는 일에 관심이 있어 보여",
    "environment": "고객이나 동료와 직접 대화하고, 들은 의견을 일에 반영할 수 있는 곳",
    "jobs": [
      "고객 지원·CS 기획",
      "영업·파트너 관리",
      "인사·커뮤니티 운영"
    ],
    "reason": "고객에게 필요한 제품을 제안하거나, 동료와 참여자들의 의견을 듣고 조정하는 일을 살펴봐",
    "experiment": "친구 3명에게 같은 서비스를 쓰면서 불편했던 점을 물어봐\n공통으로 나온 의견을 정리하고, 바꾸면 좋을 방법을 친구들에게 설명해봐",
    "partner": "대화에서 나온 의견을 할 일과 일정으로 정리해주는 사람",
    "imageClass": "potato-E",
    "imageAlt": "두 감자 친구의 이야기를 듣고 함께 대화하는 감자"
  }
};
function calculateResult(indices){
 if(!Array.isArray(indices)||indices.length!==7||indices.some(x=>!Number.isInteger(x)||x<0||x>3))throw new Error('Seven valid choices required');
 const scores={F:0,T:0,I:0,E:0};
 indices.forEach((choice,q)=>{const o=QUESTIONS[q].options[choice];scores[o.p]+=2;scores[o.s]+=1});
 const ranked=Object.keys(scores).sort((a,b)=>scores[b]-scores[a]);
 const max=scores[ranked[0]];
 const leaders=ranked.filter(a=>scores[a]===max);
 const close=scores[ranked[0]]-scores[ranked[1]]<=2;
 return {scores,ranked,leaders,close,total:21,version:'weekmate-behavior-v2'};
}
if(typeof module!=='undefined') module.exports={QUESTIONS,AXES,PROFILES,calculateResult};
