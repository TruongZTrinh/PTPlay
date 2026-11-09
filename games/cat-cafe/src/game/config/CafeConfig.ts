export type RoomId = 'cafe' | 'garden' | 'loft';
export type TimeOfDay = 'day' | 'sunset' | 'night';
export type WeatherType = 'sunny' | 'rainy' | 'cozy';
export type CatPersonality = 'sleepy' | 'playful' | 'foodie' | 'curious' | 'affectionate' | 'shy';

export interface CatCoat {
  id: number;
  name: string;
  nameVi: string;
  primaryColor: number;
  secondaryColor: number;
  earColor: number;
  bellyColor: number;
  eyeColor: number;
  descriptionVi: string;
}

export const COAT_VARIANTS: CatCoat[] = [
  {
    id: 0,
    name: 'Ginger Tabby',
    nameVi: 'Mướp Cam Đáng Yêu',
    primaryColor: 0xF59E0B, // Amber orange
    secondaryColor: 0xD97706, // Darker stripes
    earColor: 0xFCA5A5,
    bellyColor: 0xFEF3C7,
    eyeColor: 0x10B981, // Emerald green
    descriptionVi: 'Bé mèo mướp cam béo tròn, luôn thích ăn ngon và nằm ườn tắm nắng.',
  },
  {
    id: 1,
    name: 'Pure White Cloud',
    nameVi: 'Bạch Tuyết Kiêu Kỳ',
    primaryColor: 0xF8FAFC, // Pure white
    secondaryColor: 0xE2E8F0,
    earColor: 0xF9A8D4,
    bellyColor: 0xFFFFFF,
    eyeColor: 0x38BDF8, // Sky blue
    descriptionVi: 'Bộ lông trắng muốt như mây bông, dáng đi thanh lịch tựa công chúa.',
  },
  {
    id: 2,
    name: 'Smoky Slate Gray',
    nameVi: 'Xám Tro Lạnh Lùng',
    primaryColor: 0x64748B, // Slate gray
    secondaryColor: 0x475569,
    earColor: 0xF472B6,
    bellyColor: 0xCBD5E1,
    eyeColor: 0xFBBF24, // Amber gold
    descriptionVi: 'Trầm tính và điềm đạm, thích quan sát thế giới từ trên cao.',
  },
  {
    id: 3,
    name: 'Tuxedo Gentleman',
    nameVi: 'Tuxedo Quý Tộc',
    primaryColor: 0x1E293B, // Deep dark slate
    secondaryColor: 0x0F172A,
    earColor: 0xF472B6,
    bellyColor: 0xFFFFFF, // Pure white bib & socks
    eyeColor: 0xA3E635, // Lime green
    descriptionVi: 'Mặc áo vest lịch lãm bẩm sinh, luôn chào đón khách bằng vẻ quý phái.',
  },
  {
    id: 4,
    name: 'Calico Lucky Charm',
    nameVi: 'Tam Thể May Mắn',
    primaryColor: 0xEA580C, // Calico orange
    secondaryColor: 0x334155, // Midnight patches
    earColor: 0xF472B6,
    bellyColor: 0xFFFBEB, // Cream chest
    eyeColor: 0x34D399, // Seafoam green
    descriptionVi: 'Biểu tượng mang lại may mắn và bình an cho cả quán mèo.',
  },
  {
    id: 5,
    name: 'Midnight Black',
    nameVi: 'Mun Đen Huyền Bí',
    primaryColor: 0x18181B, // Jet black
    secondaryColor: 0x27272A,
    earColor: 0x71717A,
    bellyColor: 0x27272A,
    eyeColor: 0xFACC15, // Bright yellow topaz
    descriptionVi: 'Bé mèo mun với đôi mắt sáng lấp lánh như hai vì sao trong đêm.',
  },
  {
    id: 6,
    name: 'Honey Cream',
    nameVi: 'Vàng Kem Dịu Dàng',
    primaryColor: 0xFDE68A, // Soft cream pastel
    secondaryColor: 0xF59E0B,
    earColor: 0xFCA5A5,
    bellyColor: 0xFFFDF0,
    eyeColor: 0x06B6D4, // Turquoise
    descriptionVi: 'Ấm áp ngọt ngào như cốc trà sữa mật ong ngày đông.',
  },
  {
    id: 7,
    name: 'Royal Siamese',
    nameVi: 'Xiêm Quý Phái',
    primaryColor: 0xE2E8F0, // Cream beige body
    secondaryColor: 0x451A03, // Dark chocolate muzzle/ears/tail
    earColor: 0x451A03,
    bellyColor: 0xF1F5F9,
    eyeColor: 0x2563EB, // Deep sapphire blue
    descriptionVi: 'Khuôn mặt bánh mì cháy kiêu sa, thông minh và cực kỳ quấn chủ.',
  },
];

export interface PersonalityDef {
  id: CatPersonality;
  nameVi: string;
  descVi: string;
  hungerRate: number; // multiplier
  energyRecovery: number; // multiplier
  playfulness: number; // 0 to 1
  dialogues: string[];
}

export const PERSONALITY_DEFS: Record<CatPersonality, PersonalityDef> = {
  sleepy: {
    id: 'sleepy',
    nameVi: 'Thích Ngủ Nướng 💤',
    descVi: 'Có thể ngủ bất cứ đâu, hồi phục năng lượng nhanh nhưng rất lười chạy nhảy.',
    hungerRate: 0.8,
    energyRecovery: 1.4,
    playfulness: 0.3,
    dialogues: ['Khò khò... ngủ thêm 5 phút nữa thôi...', 'Ổ đệm này êm ái quá...', 'Oáp... lại buồn ngủ rồi.'],
  },
  playful: {
    id: 'playful',
    nameVi: 'Siêu Tinh Nghịch 🧶',
    descVi: 'Năng lượng tràn trề, thích vồ bóng len, leo cây cào móng và nhào lộn.',
    hungerRate: 1.2,
    energyRecovery: 0.9,
    playfulness: 0.9,
    dialogues: ['Bóng len đâu rồi? Nhào vô!', 'Bắt được cái bóng rồi nhé!', 'Xem tài bật cao của mèo đây!'],
  },
  foodie: {
    id: 'foodie',
    nameVi: 'Thánh Ăn Vặt 🐟',
    descVi: 'Luôn túc trực quanh bát ăn, cứ có đồ ăn ngon là mắt sáng rực.',
    hungerRate: 1.5,
    energyRecovery: 1.0,
    playfulness: 0.5,
    dialogues: ['Mùi cá nướng thơm quá đi mất!', 'Bát ăn sắp hết rồi kìa sen ơi...', 'Nhoàm nhoàm... ngon tuyệt cú mèo!'],
  },
  curious: {
    id: 'curious',
    nameVi: 'Nhà Thám Hiểm 🔍',
    descVi: 'Thích đi tuần khắp mọi ngóc ngách, ngắm chim ngoài cửa sổ và ngửi hoa trong vườn.',
    hungerRate: 1.0,
    energyRecovery: 1.0,
    playfulness: 0.7,
    dialogues: ['Ngoài cửa sổ có chú chim sẻ kìa!', 'Góc phòng này có gì thơm thơm thế nhỉ?', 'Đi tuần tra quán mèo thôi!'],
  },
  affectionate: {
    id: 'affectionate',
    nameVi: 'Bé Nũng Nịu 💖',
    descVi: 'Thích được thả tim và vuốt ve, khi vui sướng sẽ kêu rừ rừ liên tục.',
    hungerRate: 1.0,
    energyRecovery: 1.1,
    playfulness: 0.6,
    dialogues: ['Rừ rừ rừ... ấm áp quá!', 'Xoa cằm cho bé nữa đi mà~', 'Yêu sen nhiều nhất quả đất!'],
  },
  shy: {
    id: 'shy',
    nameVi: 'E Thẹn Dễ Thương 🌸',
    descVi: 'Thích những chỗ nằm kín đáo, từ tốn làm quen nhưng khi đã thân thì rất trung thành.',
    hungerRate: 0.9,
    energyRecovery: 1.1,
    playfulness: 0.4,
    dialogues: ['Bé nấp ở đây có ai thấy không nhỉ?', 'Chào sen... ngượng quá đi...', 'Bé chỉ cần ngồi cạnh sen là vui rồi.'],
  },
};

export interface LevelMilestone {
  level: number;
  requiredPurrs: number;
  titleVi: string;
  rewardVi: string;
  unlockedItem?: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 1, requiredPurrs: 0, titleVi: 'Quán Mới Khai Trương', rewardVi: 'Khởi đầu với 3 bé mèo NPC đáng yêu' },
  { level: 2, requiredPurrs: 100, titleVi: 'Góc Trà Sữa Thơm', rewardVi: 'Mở khoá Cốc Trà Sữa & Đèn Ngủ Gỗ Mèo', unlockedItem: 'decor_lamp' },
  { level: 3, requiredPurrs: 300, titleVi: 'Khu Vườn Tràn Nắng', rewardVi: 'MỞ KHOÁ VÙNG ĐẤT MỚI: Sunny Garden (Vườn Mèo)!', unlockedItem: 'room_garden' },
  { level: 4, requiredPurrs: 600, titleVi: 'Cây Cào Móng Cao Cấp', rewardVi: 'Mở khoá Cây Cào Móng 3 Tầng Sisal', unlockedItem: 'decor_cat_tree_deluxe' },
  { level: 5, requiredPurrs: 1000, titleVi: 'Gác Xép Ấm Áp', rewardVi: 'MỞ KHOÁ VÙNG ĐẤT MỚI: Nap Loft (Gác Ngủ Lofi)!', unlockedItem: 'room_loft' },
  { level: 6, requiredPurrs: 1500, titleVi: 'Bát Ăn Pha Lê Vàng', rewardVi: 'Mở khoá Bát Ăn Cá Hồi Hoàng Gia', unlockedItem: 'decor_gold_bowl' },
  { level: 7, requiredPurrs: 2200, titleVi: 'Tiệm Mèo Nổi Tiếng', rewardVi: 'Mở khoá Đèn Lồng Hoa Anh Đào & Thảm Ba Tư', unlockedItem: 'decor_carpet' },
  { level: 8, requiredPurrs: 3000, titleVi: 'Giường Nệm Hoàng Gia', rewardVi: 'Mở khoá Sofa Nệm Nhung Cho Mèo', unlockedItem: 'decor_royal_sofa' },
  { level: 9, requiredPurrs: 4000, titleVi: 'Vườn Bướm Thần Tiên', rewardVi: 'Mở khoá Đài Phun Nước Bồ Câu & Bướm Vườn', unlockedItem: 'decor_fountain' },
  { level: 10, requiredPurrs: 5500, titleVi: 'Thiên Đường Café Mòe', rewardVi: 'Danh hiệu Đỉnh Cao & Vòng Nguyệt Quế Vàng!', unlockedItem: 'decor_trophy' },
];

export interface ChallengeDef {
  id: string;
  titleVi: string;
  descVi: string;
  targetCount: number;
  rewardPurrs: number;
  type: 'join' | 'feed' | 'play' | 'nap' | 'love' | 'photo' | 'garden';
}

export const SESSION_CHALLENGES: ChallengeDef[] = [
  { id: 'ch_1', titleVi: 'Tiếng Chuông Cửa Reo', descVi: 'Chào đón 5 bé mèo của khán giả vào quán', targetCount: 5, rewardPurrs: 60, type: 'join' },
  { id: 'ch_2', titleVi: 'Bữa Tiệc No Bụng', descVi: 'Cho các bé mèo ăn 10 lần qua lệnh ĂN', targetCount: 10, rewardPurrs: 80, type: 'feed' },
  { id: 'ch_3', titleVi: 'Đại Chiến Cuộn Len', descVi: 'Cùng các bé mèo chơi đùa 8 lần qua lệnh CHƠI', targetCount: 8, rewardPurrs: 70, type: 'play' },
  { id: 'ch_4', titleVi: 'Giấc Trưa Bình Yên', descVi: 'Ru các chú mèo ngủ say 5 lần qua lệnh NGỦ', targetCount: 5, rewardPurrs: 50, type: 'nap' },
  { id: 'ch_5', titleVi: 'Cơn Mưa Tình Yêu', descVi: 'Thả tim nồng thắm 12 lần qua lệnh YÊU', targetCount: 12, rewardPurrs: 90, type: 'love' },
  { id: 'ch_6', titleVi: 'Nhiếp Ảnh Gia Mèo', descVi: 'Lưu giữ 3 khoảnh khắc đáng yêu qua lệnh CHỤP', targetCount: 3, rewardPurrs: 60, type: 'photo' },
  { id: 'ch_7', titleVi: 'Dạo Bước Trong Vườn', descVi: 'Đưa mèo ra vườn tắm nắng 5 lần qua lệnh VƯỜN', targetCount: 5, rewardPurrs: 80, type: 'garden' },
  { id: 'ch_8', titleVi: 'Cộng Đồng Rôm Rả', descVi: 'Đạt mốc 8 bé mèo cùng xuất hiện trong quán', targetCount: 8, rewardPurrs: 100, type: 'join' },
  { id: 'ch_9', titleVi: 'Món Cá Thơm Lừng', descVi: 'Thực hiện 15 lượt cho ăn bữa trưa ngon miệng', targetCount: 15, rewardPurrs: 110, type: 'feed' },
  { id: 'ch_10', titleVi: 'Tiếng Rừ Rừ Hạnh Phúc', descVi: 'Thả tim và vuốt ve mèo 20 lần', targetCount: 20, rewardPurrs: 120, type: 'love' },
  { id: 'ch_11', titleVi: 'Mèo Lười Nằm Ổ', descVi: 'Giúp 8 bé mèo ngủ ngoan trên nệm êm', targetCount: 8, rewardPurrs: 90, type: 'nap' },
  { id: 'ch_12', titleVi: 'Vũ Điệu Lông Xù', descVi: 'Tham gia 12 lượt chơi leo cây và bắt bướm', targetCount: 12, rewardPurrs: 100, type: 'play' },
];

export const CAFE_CONFIG = {
  width: 540,
  height: 960,
  safeMargin: 40,
  maxCats: 20, // 3 NPCs + up to 17 viewers onscreen
  maxWaitlist: 50,
  initialNpcCount: 3,
  userCooldownMs: 2000,
  bridgeWsUrl: 'ws://localhost:8088/game?app=cat-cafe',

  // Color Palette
  colors: {
    brandBlue: 0x0066FF,
    brandGold: 0xFFD700,
    darkNavy: 0x08142D,
    wallCream: 0xFDF6E2,
    floorWood: 0xE6C280,
    accentPink: 0xFF85A1,
    accentMint: 0x6EE7B7,
    textDark: 0x1F2937,
    textWhite: 0xFFFFFF,
  },

  // Default NPCs with deep personalities
  initialNpcs: [
    { id: 'npc_1', nickname: 'Mimi 🌸', coatVariant: 0, personality: 'playful' as CatPersonality },
    { id: 'npc_2', nickname: 'Bánh Mì 🍞', coatVariant: 1, personality: 'sleepy' as CatPersonality },
    { id: 'npc_3', nickname: 'Miu Miu 🐾', coatVariant: 4, personality: 'foodie' as CatPersonality },
  ],
} as const;
