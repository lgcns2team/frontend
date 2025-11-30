// 시대를 구분하는 기준 연도 상수를 만들어두면 관리하기 더 편할 거야!
export const ERA_LIMITS = {
    GOJOSEON_END: -108,
    PROTO_THREE_KINGDOMS_END: 300, // 대략적인 구분
    THREE_KINGDOMS_END: 698, // 발해 건국 기준 (남북국 시대 시작)
    NORTH_SOUTH_STATES_END: 918, // 고려 건국 기준
    GORYEO_END: 1392,
    JOSEON_END: 1897, // 대한제국 선포
    KOREAN_EMPIRE_END: 1910,
    COLONIAL_PERIOD_END: 1945,
};

export const getEraName = (year: number): string => {
    if (year < ERA_LIMITS.GOJOSEON_END) return '고조선';
    if (year < ERA_LIMITS.PROTO_THREE_KINGDOMS_END) return '원삼국시대';
    if (year < ERA_LIMITS.THREE_KINGDOMS_END) return '삼국시대';
    if (year < ERA_LIMITS.NORTH_SOUTH_STATES_END) return '남북국시대';
    if (year < ERA_LIMITS.GORYEO_END) return '고려시대';
    if (year < ERA_LIMITS.JOSEON_END) return '조선시대';
    if (year < ERA_LIMITS.KOREAN_EMPIRE_END) return '대한제국';
    if (year < ERA_LIMITS.COLONIAL_PERIOD_END) return '일제강점기';
    return '대한민국';
};

export const getEraColor = (year: number): string => {
    // 고조선: 청동기 문명의 묵직하고 고전적인 느낌 (브론즈 베이지)
    if (year < ERA_LIMITS.GOJOSEON_END) return '#D7C0AE';

    // 원삼국: 여러 소국이 자라나는 새싹 같은 시기 (연한 올리브 그린)
    if (year < ERA_LIMITS.PROTO_THREE_KINGDOMS_END) return '#E2E8F0';

    // 삼국: 영토 확장의 열정과 역동성 (활기찬 코랄 레드)
    if (year < ERA_LIMITS.THREE_KINGDOMS_END) return '#FDA4AF';

    // 남북국: 신라의 황금 문화와 발해의 기상 (화려한 앰버 골드)
    if (year < ERA_LIMITS.NORTH_SOUTH_STATES_END) return '#FCD34D';

    // 고려: 우아하고 신비로운 고려청자 색 (비취색/청록색)
    if (year < ERA_LIMITS.GORYEO_END) return '#5EEAD4';

    // 조선: 선비의 청렴함과 백의민족 (단아한 쪽빛/스카이 블루)
    if (year < ERA_LIMITS.JOSEON_END) return '#93C5FD';

    // 대한제국: 황실의 존엄과 근대화의 의지 (고귀한 로얄 퍼플)
    if (year < ERA_LIMITS.KOREAN_EMPIRE_END) return '#C084FC';

    // 일제강점기: 우리 민족의 아픔, 잊지 말아야 할 시간 (무채색 그레이)
    if (year < ERA_LIMITS.COLONIAL_PERIOD_END) return '#94A3B8';

    // 대한민국: 밝은 미래와 희망 (청량하고 맑은 딥 블루)
    if (year >= ERA_LIMITS.COLONIAL_PERIOD_END) return '#3B82F6';

    return '#CBD5E1'; // 기본값
};