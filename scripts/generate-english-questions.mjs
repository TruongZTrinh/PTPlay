import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplePath = path.resolve(__dirname, '../games/english-class-live/src/data/questions.sample.json');
const outputPath = path.resolve(__dirname, '../games/english-class-live/src/data/questions.json');

const sampleQuestions = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));
console.log(`Loaded ${sampleQuestions.length} base sample questions.`);

const extraQuestions = [];

// Helper to add questions cleanly
function addQ(id, topic, mode, difficulty, prompt, promptVi, choices, correct, explanation, durationSec = 14, extra = {}) {
  extraQuestions.push({
    id,
    topic,
    mode,
    difficulty,
    prompt,
    promptVi,
    choices,
    correct,
    explanation,
    durationSec,
    ...extra,
  });
}

// -------------------------------------------------------------
// 1. PICTURE QUIZ QUESTIONS (40 questions)
// -------------------------------------------------------------
const pictureData = [
  ['pic-001', 'food', 'What fruit is red and crunchy? 🍎', 'Quả gì màu đỏ giòn ngọt?', { A: 'Apple', B: 'Banana', C: 'Orange', D: 'Grape' }, 'A', 'Apple là quả táo màu đỏ thơm ngon.', 'apple'],
  ['pic-002', 'animals', 'Who is known as the King of the Jungle? 🦁', 'Con vật nào là vua của rừng xanh?', { A: 'Tiger', B: 'Lion', C: 'Elephant', D: 'Bear' }, 'B', 'Lion nghĩa là sư tử, chúa sơn lâm.', 'lion'],
  ['pic-003', 'animals', 'Which animal gives us milk and says moo? 🐄', 'Con vật nào cho sữa và kêu "moo"?', { A: 'Cow', B: 'Horse', C: 'Sheep', D: 'Goat' }, 'A', 'Cow là con bò sữa.', 'cow'],
  ['pic-004', 'transport', 'What vehicle flies high in the sky with wings? ✈️', 'Phương tiện nào bay trên bầu trời?', { A: 'Car', B: 'Boat', C: 'Airplane', D: 'Bicycle' }, 'C', 'Airplane là máy bay.', 'airplane'],
  ['pic-005', 'nature', 'What shines brightly in the sky during the day? ☀️', 'Vật thể nào toả sáng ban ngày?', { A: 'Moon', B: 'Sun', C: 'Star', D: 'Cloud' }, 'B', 'Sun là Mặt Trời toả sáng rực rỡ.', 'sun'],
  ['pic-006', 'animals', 'What sea animal has eight tentacles? 🐙', 'Con vật biển nào có 8 chiếc xúc tu?', { A: 'Shark', B: 'Whale', C: 'Octopus', D: 'Dolphin' }, 'C', 'Octopus là con bạch tuộc.', 'octopus'],
  ['pic-007', 'food', 'What yellow fruit is monkeys favourite? 🍌', 'Quả màu vàng chú khỉ rất thích?', { A: 'Banana', B: 'Mango', C: 'Lemon', D: 'Papaya' }, 'A', 'Banana là quả chuối chín vàng.', 'banana'],
  ['pic-008', 'school', 'What do we read to learn new stories and knowledge? 📚', 'Chúng ta đọc cái gì để có kiến thức?', { A: 'Pencil', B: 'Book', C: 'Ruler', D: 'Backpack' }, 'B', 'Book là quyển sách.', 'book'],
  ['pic-009', 'animals', 'What animal has a very long neck? 🦒', 'Con vật nào có chiếc cổ rất dài?', { A: 'Zebra', B: 'Hippo', C: 'Giraffe', D: 'Crocodile' }, 'C', 'Giraffe là con hươu cao cổ.', 'giraffe'],
  ['pic-010', 'nature', 'What falls from dark clouds when it storms? 🌧️', 'Cái gì rơi từ mây đen khi mưa gió?', { A: 'Snow', B: 'Rain', C: 'Wind', D: 'Fog' }, 'B', 'Rain là những hạt mưa rơi xuống.', 'rain'],
  ['pic-011', 'transport', 'What two-wheeled vehicle do you pedal? 🚲', 'Xe hai bánh đạp bằng chân gọi là gì?', { A: 'Bicycle', B: 'Motorcycle', C: 'Scooter', D: 'Truck' }, 'A', 'Bicycle là chiếc xe đạp thân thuộc.', 'bicycle'],
  ['pic-012', 'food', 'What orange vegetable do rabbits love to munch? 🥕', 'Củ màu cam chú thỏ thích gặm?', { A: 'Potato', B: 'Tomato', C: 'Carrot', D: 'Onion' }, 'C', 'Carrot là củ cà rốt giòn ngọt.', 'carrot'],
  ['pic-013', 'home', 'What furniture do you sleep on at night? 🛏️', 'Bạn ngủ trên đồ nội thất nào ban đêm?', { A: 'Chair', B: 'Table', C: 'Bed', D: 'Sofa' }, 'C', 'Bed là chiếc giường ngủ êm ái.', 'bed'],
  ['pic-014', 'animals', 'Which black and white bird cannot fly but swims well? 🐧', 'Loài chim đen trắng không bay được nhưng bơi giỏi?', { A: 'Penguin', B: 'Eagle', C: 'Parrot', D: 'Duck' }, 'A', 'Penguin là chim cánh cụt xứ băng giá.', 'penguin'],
  ['pic-015', 'school', 'What instrument helps you draw straight lines? 📏', 'Dụng cụ nào giúp bạn vẽ đường thẳng?', { A: 'Compass', B: 'Ruler', C: 'Eraser', D: 'Glue' }, 'B', 'Ruler là cây thước kẻ học sinh.', 'ruler'],
  ['pic-016', 'nature', 'What colorful arc appears after rain and sunshine? 🌈', 'Dải màu cầu vồng sau cơn mưa gọi là gì?', { A: 'Lightning', B: 'Rainbow', C: 'Aurora', D: 'Sunset' }, 'B', 'Rainbow là chiếc cầu vồng 7 sắc.', 'rainbow'],
  ['pic-017', 'food', 'What round Italian dish has melted cheese and tomato? 🍕', 'Món bánh tròn Ý phủ phô mai nướng thơm lừng?', { A: 'Burger', B: 'Pizza', C: 'Pasta', D: 'Salad' }, 'B', 'Pizza là món bánh nướng Ý nổi tiếng.', 'pizza'],
  ['pic-018', 'animals', 'Which cute animal loves bamboo and lives in China? 🐼', 'Gấu dễ thương thích ăn tre trúc sống ở Trung Quốc?', { A: 'Koala', B: 'Panda', C: 'Brown Bear', D: 'Raccoon' }, 'B', 'Panda là chú gấu trúc ngộ nghĩnh.', 'panda'],
  ['pic-019', 'clothing', 'What footwear do you wear on your feet for running? 👟', 'Bạn xỏ gì vào chân khi chạy thể thao?', { A: 'Hat', B: 'Sneakers', C: 'Gloves', D: 'Scarf' }, 'B', 'Sneakers là giày thể thao năng động.', 'sneakers'],
  ['pic-020', 'technology', 'What smart screen device do you hold in your hand? 📱', 'Thiết bị màn hình cảm ứng bỏ túi gọi là gì?', { A: 'Smartphone', B: 'Microwave', C: 'Printer', D: 'Toaster' }, 'A', 'Smartphone là chiếc điện thoại thông minh.', 'smartphone'],
  ['pic-021', 'animals', 'What animal has a pouch to carry its baby and hops? 🦘', 'Loài thú có túi trước bụng và nhảy rất cao?', { A: 'Kangaroo', B: 'Camel', C: 'Wolf', D: 'Fox' }, 'A', 'Kangaroo là chuột túi nước Úc.', 'kangaroo'],
  ['pic-022', 'nature', 'What beautiful flower has sharp thorns on its stem? 🌹', 'Bông hoa đỏ rực có gai nhọn trên cành?', { A: 'Lotus', B: 'Rose', C: 'Daisy', D: 'Tulip' }, 'B', 'Rose là bông hoa hồng quyến rũ.', 'rose'],
  ['pic-023', 'home', 'What electrical box keeps your ice cream cold? 🧊', 'Thiết bị gia dụng nào làm đá và giữ kem lạnh?', { A: 'Oven', B: 'Refrigerator', C: 'Heater', D: 'Blender' }, 'B', 'Refrigerator (Fridge) là chiếc tủ lạnh.', 'refrigerator'],
  ['pic-024', 'jobs', 'Who flies airplanes across countries and oceans? 👨‍✈️', 'Ai lái máy bay qua các quốc gia?', { A: 'Driver', B: 'Pilot', C: 'Sailor', D: 'Engineer' }, 'B', 'Pilot là phi công lái máy bay.', 'pilot'],
  ['pic-025', 'sports', 'What ball sport is played on grass with 11 players? ⚽', 'Môn thể thao vua 11 người trên sân cỏ?', { A: 'Football', B: 'Tennis', C: 'Golf', D: 'Basketball' }, 'A', 'Football (Soccer) là môn bóng đá.', 'football'],
  ['pic-026', 'animals', 'What insect makes sweet honey in a hive? 🐝', 'Loài côn trùng chăm chỉ làm ra mật ngọt?', { A: 'Ant', B: 'Bee', C: 'Mosquito', D: 'Fly' }, 'B', 'Bee là chú ong mật chăm chỉ.', 'bee'],
  ['pic-027', 'food', 'What cold creamy sweet treat melts in hot summer? 🍦', 'Món tráng miệng mát lạnh tan chảy mùa hè?', { A: 'Soup', B: 'Ice cream', C: 'Bread', D: 'Pancake' }, 'B', 'Ice cream là món kem thơm mát.', 'ice_cream'],
  ['pic-028', 'home', 'What do you use to cut paper or cloth? ✂️', 'Dụng cụ gồm 2 lưỡi bén dùng để cắt giấy?', { A: 'Scissors', B: 'Hammer', C: 'Screwdriver', D: 'Wrench' }, 'A', 'Scissors là chiếc kéo cắt giấy.', 'scissors'],
  ['pic-029', 'nature', 'What giant ball of hot gas lights up our universe? ⭐', 'Thiên thể lấp lánh trong đêm vũ trụ?', { A: 'Star', B: 'Planet', C: 'Comet', D: 'Meteor' }, 'A', 'Star là ngôi sao sáng rực rỡ.', 'star'],
  ['pic-030', 'clothing', 'What accessory protects your eyes from strong sunlight? 🕶️', 'Vật dụng bảo vệ mắt bạn khỏi ánh nắng chói?', { A: 'Sunglasses', B: 'Belt', C: 'Tie', D: 'Ring' }, 'A', 'Sunglasses là chiếc kính râm thời trang.', 'sunglasses'],
  ['pic-031', 'animals', 'What bird repeats human words and has green feathers? 🦜', 'Loài chim lông sặc sỡ biết nhại tiếng người?', { A: 'Crow', B: 'Parrot', C: 'Owl', D: 'Sparrow' }, 'B', 'Parrot là chú vẹt thông minh.', 'parrot'],
  ['pic-032', 'nature', 'What large body of saltwater covers most of Earth? 🌊', 'Vùng nước mặn bao la bao phủ Trái Đất?', { A: 'Lake', B: 'River', C: 'Ocean', D: 'Pond' }, 'C', 'Ocean là đại dương bao la.', 'ocean'],
  ['pic-033', 'jobs', 'Who cures sick people and works in a hospital? 🩺', 'Ai chữa bệnh cho mọi người tại bệnh viện?', { A: 'Teacher', B: 'Doctor', C: 'Chef', D: 'Singer' }, 'B', 'Doctor là bác sĩ tận tụy.', 'doctor'],
  ['pic-034', 'food', 'What large juicy fruit is green outside and red inside? 🍉', 'Quả gì vỏ xanh ruột đỏ hạt đen ngọt mát?', { A: 'Watermelon', B: 'Melon', C: 'Coconut', D: 'Guava' }, 'A', 'Watermelon là quả dưa hấu giải nhiệt.', 'watermelon'],
  ['pic-035', 'music', 'What string instrument do you hold and strum with fingers? 🎸', 'Nhạc cụ có dây gảy bằng ngón tay tạo giai điệu?', { A: 'Drum', B: 'Guitar', C: 'Flute', D: 'Piano' }, 'B', 'Guitar là cây đàn ghi-ta quen thuộc.', 'guitar'],
  ['pic-036', 'sports', 'What water sport involves moving your arms and legs? 🏊', 'Môn thể thao bơi lội dưới làn nước mát?', { A: 'Swimming', B: 'Running', C: 'Boxing', D: 'Jumping' }, 'A', 'Swimming là môn bơi lội rèn sức khỏe.', 'swimming'],
  ['pic-037', 'animals', 'What reptile has a hard shell and moves very slowly? 🐢', 'Con vật có mai cứng và di chuyển rất chậm?', { A: 'Turtle', B: 'Snake', C: 'Lizard', D: 'Frog' }, 'A', 'Turtle (Tortoise) là chú rùa mai cứng.', 'turtle'],
  ['pic-038', 'time', 'What wall device ticks and tells us what time it is? ⏰', 'Vật trên tường tích tắc chỉ giờ cho chúng ta?', { A: 'Clock', B: 'Calendar', C: 'Thermometer', D: 'Scale' }, 'A', 'Clock là chiếc đồng hồ xem giờ.', 'clock'],
  ['pic-039', 'food', 'What white liquid comes from coconuts or dairy cows? 🥛', 'Thức uống bổ dưỡng màu trắng giàu canxi?', { A: 'Juice', B: 'Milk', C: 'Tea', D: 'Coffee' }, 'B', 'Milk là sữa tươi giàu dinh dưỡng.', 'milk'],
  ['pic-040', 'animals', 'What bird of the night can turn its head 270 degrees? 🦉', 'Loài chim ăn đêm có đôi mắt tròn xoe quay đầu 270 độ?', { A: 'Owl', B: 'Hawk', C: 'Pigeon', D: 'Swallow' }, 'A', 'Owl là con cú mèo thông thái.', 'owl'],
];

pictureData.forEach(([id, topic, prompt, promptVi, choices, correct, explanation, key]) => {
  addQ(id, topic, 'picture', 1, prompt, promptVi, choices, correct, explanation, 12, { imageKey: key });
});

// -------------------------------------------------------------
// 2. LISTENING CHALLENGE QUESTIONS (35 questions)
// -------------------------------------------------------------
const listeningData = [
  ['listen-025', 'vocab', 'Listen: "Delicious". What is the closest Vietnamese meaning?', 'Nghe từ: "Delicious". Nghĩa tiếng Việt gần nhất là gì?', { A: 'Ngon miệng', B: 'Cay nồng', C: 'Đắng chát', D: 'Chua cay' }, 'A', 'Delicious /dɪˈlɪʃəs/ có nghĩa là ngon miệng, thơm ngon.', 'Delicious'],
  ['listen-026', 'vocab', 'Listen: "Courageous". What does it mean?', 'Nghe từ: "Courageous". Từ này mang nghĩa là gì?', { A: 'Nhút nhát', B: 'Dũng cảm', C: 'Tò mò', D: 'Lười biếng' }, 'B', 'Courageous /kəˈreɪdʒəs/ nghĩa là can đảm, dũng cảm.', 'Courageous'],
  ['listen-027', 'vocab', 'Listen: "Enthusiastic". What does it mean?', 'Nghe từ: "Enthusiastic". Nghĩa là gì?', { A: 'Nhiệt tình', B: 'Thờ ơ', C: 'Buồn bã', D: 'Tức giận' }, 'A', 'Enthusiastic /ɪnˌθjuːziˈæstɪk/ nghĩa là hào hứng, nhiệt huyết.', 'Enthusiastic'],
  ['listen-028', 'vocab', 'Listen: "Spectacular". What is the meaning?', 'Nghe từ: "Spectacular". Nghĩa là gì?', { A: 'Bình thường', B: 'Đẹp ngoạn mục', C: 'Nhạt nhòa', D: 'Tối tăm' }, 'B', 'Spectacular /spekˈtækjələ(r)/ nghĩa là ngoạn mục, hoành tráng.', 'Spectacular'],
  ['listen-029', 'vocab', 'Listen: "Generous". What does it mean?', 'Nghe từ: "Generous". Nghĩa là gì?', { A: 'Keo kiệt', B: 'Hào phóng', C: 'Nóng nảy', D: 'Bướng bỉnh' }, 'B', 'Generous /ˈdʒenərəs/ nghĩa là rộng rãi, hào phóng.', 'Generous'],
  ['listen-030', 'vocab', 'Listen: "Patience". What does it describe?', 'Nghe từ: "Patience". Từ này chỉ điều gì?', { A: 'Sự kiên nhẫn', B: 'Sự vội vàng', C: 'Sự tự tin', D: 'Sự tò mò' }, 'A', 'Patience /ˈpeɪʃns/ nghĩa là lòng kiên nhẫn.', 'Patience'],
  ['listen-031', 'vocab', 'Listen: "Adventure". What is this experience?', 'Nghe từ: "Adventure". Trải nghiệm này là gì?', { A: 'Cuộc phiêu lưu', B: 'Giấc ngủ trưa', C: 'Bài kiểm tra', D: 'Bữa ăn tối' }, 'A', 'Adventure /ədˈventʃə(r)/ là cuộc phiêu lưu mạo hiểm.', 'Adventure'],
  ['listen-032', 'vocab', 'Listen: "Magnificent". What does it describe?', 'Nghe từ: "Magnificent". Từ này mô tả điều gì?', { A: 'Tráng lệ nguy nga', B: 'Nhỏ bé chật chội', C: 'Tầm thường', D: 'Xấu xí' }, 'A', 'Magnificent /mæɡˈnɪfɪsnt/ nghĩa là lộng lẫy, tráng lệ.', 'Magnificent'],
  ['listen-033', 'vocab', 'Listen: "Curiosity". What quality is this?', 'Nghe từ: "Curiosity". Đây là phẩm chất gì?', { A: 'Tính hiếu kỳ', B: 'Sự sợ hãi', C: 'Lòng tham', D: 'Tính kiêu căng' }, 'A', 'Curiosity /ˌkjʊəriˈɒsəti/ là tính tò mò, ham học hỏi.', 'Curiosity'],
  ['listen-034', 'vocab', 'Listen: "Friendship". What bond is this?', 'Nghe từ: "Friendship". Tình cảm thiêng liêng này là gì?', { A: 'Tình bạn', B: 'Sự thù địch', C: 'Sự nghi ngờ', D: 'Cạnh tranh' }, 'A', 'Friendship /ˈfrendʃɪp/ nghĩa là tình bạn ấm áp.', 'Friendship'],
  ['listen-035', 'vocab', 'Listen: "Happiness". What state of mind is this?', 'Nghe từ: "Happiness". Trạng thái này là gì?', { A: 'Hạnh phúc', B: 'Lo âu', C: 'Thất vọng', D: 'Mệt mỏi' }, 'A', 'Happiness /ˈhæpinəs/ nghĩa là niềm hạnh phúc ngập tràn.', 'Happiness'],
  ['listen-036', 'vocab', 'Listen: "Wisdom". What treasure of the mind is this?', 'Nghe từ: "Wisdom". Phẩm chất quý báu này là gì?', { A: 'Sự thông thái', B: 'Sự ngờ nghệch', C: 'Lòng đố kỵ', D: 'Sự giận dữ' }, 'A', 'Wisdom /ˈwɪzdəm/ nghĩa là trí tuệ, sự thông thái.', 'Wisdom'],
  ['listen-037', 'vocab', 'Listen: "Challenge". What does it represent?', 'Nghe từ: "Challenge". Từ này có nghĩa là gì?', { A: 'Thử thách', B: 'Phần thưởng', C: 'Thói quen', D: 'Lối tắt' }, 'A', 'Challenge /ˈtʃælɪndʒ/ nghĩa là thử thách cần vượt qua.', 'Challenge'],
  ['listen-038', 'vocab', 'Listen: "Grateful". How does a grateful person feel?', 'Nghe từ: "Grateful". Người này cảm thấy thế nào?', { A: 'Biết ơn', B: 'Vô ơn', C: 'Bực bội', D: 'Lãnh đạm' }, 'A', 'Grateful /ˈɡreɪtfl/ nghĩa là tràn đầy lòng biết ơn.', 'Grateful'],
  ['listen-039', 'vocab', 'Listen: "Creative". What describes a creative person?', 'Nghe từ: "Creative". Người sáng tạo như thế nào?', { A: 'Giàu sáng tạo', B: 'Rập khuôn', C: 'Nhàm chán', D: 'Bảo thủ' }, 'A', 'Creative /kriˈeɪtɪv/ nghĩa là sáng tạo, giàu ý tưởng.', 'Creative'],
  ['listen-040', 'vocab', 'Listen: "Optimistic". What outlook on life is this?', 'Nghe từ: "Optimistic". Cái nhìn này là gì?', { A: 'Lạc quan yêu đời', B: 'Bi quan', C: 'Bất cần', D: 'Sợ sệt' }, 'A', 'Optimistic /ˌɒptɪˈmɪstɪk/ nghĩa là lạc quan, nhìn về tương lai tươi sáng.', 'Optimistic'],
  ['listen-041', 'vocab', 'Listen: "Reliable". What kind of friend is reliable?', 'Nghe từ: "Reliable". Người bạn này như thế nào?', { A: 'Đáng tin cậy', B: 'Dối trá', C: 'Nông nổi', D: 'Vội vã' }, 'A', 'Reliable /rɪˈlaɪəbl/ nghĩa là đáng tin cậy, có thể dựa vào.', 'Reliable'],
  ['listen-042', 'vocab', 'Listen: "Independent". What does it mean?', 'Nghe từ: "Independent". Từ này có nghĩa là gì?', { A: 'Độc lập tự chủ', B: 'Phụ thuộc', C: 'Yếu đuối', D: 'Bất an' }, 'A', 'Independent /ˌɪndɪˈpendənt/ nghĩa là độc lập, tự chủ.', 'Independent'],
  ['listen-043', 'vocab', 'Listen: "Appreciation". What feeling is this?', 'Nghe từ: "Appreciation". Cảm xúc trân trọng này là gì?', { A: 'Sự trân trọng', B: 'Sự khinh miệt', C: 'Lòng ghen ghét', D: 'Sự lãng quên' }, 'A', 'Appreciation /əˌpriːʃiˈeɪʃn/ là sự ghi nhận, trân trọng.', 'Appreciation'],
  ['listen-044', 'vocab', 'Listen: "Incredible". What does this adjective mean?', 'Nghe từ: "Incredible". Tính từ này nghĩa là gì?', { A: 'Tuyệt vời khó tin', B: 'Tồi tệ', C: 'Tầm thường', D: 'Đơn giản' }, 'A', 'Incredible /ɪnˈkredəbl/ nghĩa là phi thường, đáng kinh ngạc.', 'Incredible'],
  ['listen-045', 'vocab', 'Listen: "Environment". What does this refer to?', 'Nghe từ: "Environment". Từ này chỉ điều gì?', { A: 'Môi trường sống', B: 'Kỳ nghỉ', C: 'Tòa nhà', D: 'Phương tiện' }, 'A', 'Environment /ɪnˈvaɪrənmənt/ là môi trường thiên nhiên xung quanh.', 'Environment'],
  ['listen-046', 'vocab', 'Listen: "Opportunity". What is presented to you?', 'Nghe từ: "Opportunity". Bạn nhận được điều gì?', { A: 'Cơ hội tốt', B: 'Lời phàn nàn', C: 'Khoản nợ', D: 'Áp lực' }, 'A', 'Opportunity /ˌɒpəˈtjuːnəti/ nghĩa là cơ hội, dịp may.', 'Opportunity'],
  ['listen-047', 'vocab', 'Listen: "Knowledge". What do you gain through study?', 'Nghe từ: "Knowledge". Bạn tích lũy được điều gì qua việc học?', { A: 'Kiến thức', B: 'Vàng bạc', C: 'Đồ chơi', D: 'Thời trang' }, 'A', 'Knowledge /ˈnɒlɪdʒ/ nghĩa là tri thức, kiến thức quý giá.', 'Knowledge'],
  ['listen-048', 'vocab', 'Listen: "Confidence". What inner strength is this?', 'Nghe từ: "Confidence". Sức mạnh tinh thần này là gì?', { A: 'Sự tự tin', B: 'Nỗi sợ hãi', C: 'Tính bẽn lẽn', D: 'Sự do dự' }, 'A', 'Confidence /ˈkɒnfɪdəns/ là sự tự tin vào bản thân.', 'Confidence'],
  ['listen-049', 'vocab', 'Listen: "Celebration". What happy event is this?', 'Nghe từ: "Celebration". Sự kiện rộn ràng này là gì?', { A: 'Lễ kỷ niệm/tiệc mừng', B: 'Cuộc họp gấp', C: 'Buổi thi đấu', D: 'Chuyến bay' }, 'A', 'Celebration /ˌselɪˈbreɪʃn/ là buổi lễ kỷ niệm, mừng thắng lợi.', 'Celebration'],
  ['listen-050', 'vocab', 'Listen: "Teamwork". What cooperative spirit is this?', 'Nghe từ: "Teamwork". Tinh thần hợp tác này là gì?', { A: 'Làm việc nhóm', B: 'Chơi một mình', C: 'Tranh cãi', D: 'Nghỉ ngơi' }, 'A', 'Teamwork /ˈtiːmwɜːk/ là tinh thần đồng đội, làm việc nhóm.', 'Teamwork'],
  ['listen-051', 'vocab', 'Listen: "Inspiration". What creative spark is this?', 'Nghe từ: "Inspiration". Ngọn lửa sáng tạo này là gì?', { A: 'Nguồn cảm hứng', B: 'Nỗi buồn rầu', C: 'Sự chán ngán', D: 'Bệnh tật' }, 'A', 'Inspiration /ˌɪnspəˈreɪʃn/ là nguồn cảm hứng sáng tạo.', 'Inspiration'],
  ['listen-052', 'vocab', 'Listen: "Perseverance". What virtue is never giving up?', 'Nghe từ: "Perseverance". Đức tính không bao giờ bỏ cuộc này là gì?', { A: 'Sự kiên trì bền bỉ', B: 'Tính nản lòng', C: 'Sự lười nhác', D: 'Thói ỷ lại' }, 'A', 'Perseverance /ˌpɜːsɪˈvɪərəns/ là sự kiên trì, bền chí đến cùng.', 'Perseverance'],
  ['listen-053', 'vocab', 'Listen: "Polite". How does a polite person behave?', 'Nghe từ: "Polite". Người lịch sự cư xử thế nào?', { A: 'Lịch thiệp nhã nhặn', B: 'Thô lỗ', C: 'Cộc cằn', D: 'Gắt gỏng' }, 'A', 'Polite /pəˈlaɪt/ nghĩa là lễ phép, lịch sự.', 'Polite'],
  ['listen-054', 'vocab', 'Listen: "Gentle". What describes gentle behavior?', 'Nghe từ: "Gentle". Từ này mô tả tính cách gì?', { A: 'Dịu dàng nhẹ nhàng', B: 'Hung hăng', C: 'Ồn ào', D: 'Gai góc' }, 'A', 'Gentle /ˈdʒentl/ nghĩa là dịu dàng, nhẹ nhàng êm ái.', 'Gentle'],
  ['listen-055', 'vocab', 'Listen: "Honest". What quality tells the truth?', 'Nghe từ: "Honest". Phẩm chất luôn nói sự thật là gì?', { A: 'Trung thực thật thà', B: 'Gian dối', C: 'Khôn lỏi', D: 'Lươn lẹo' }, 'A', 'Honest /ˈɒnɪst/ nghĩa là trung thực, chân thật.', 'Honest'],
  ['listen-056', 'vocab', 'Listen: "Curious". What describes a curious mind?', 'Nghe từ: "Curious". Đầu óc tò mò muốn biết mọi thứ?', { A: 'Ham hiểu biết', B: 'Thờ ơ lãnh đạm', C: 'Ngái ngủ', D: 'Khép kín' }, 'A', 'Curious /ˈkjʊəriəs/ là tò mò, ham học hỏi khám phá.', 'Curious'],
  ['listen-057', 'vocab', 'Listen: "Brilliant". What does a brilliant student show?', 'Nghe từ: "Brilliant". Học sinh xuất sắc thể hiện điều gì?', { A: 'Tài năng xuất chúng', B: 'Sự chậm chạp', C: 'Tính lơ đãng', D: 'Sự nhút nhát' }, 'A', 'Brilliant /ˈbrɪliənt/ nghĩa là tài ba xuất chúng, sáng dạ.', 'Brilliant'],
  ['listen-058', 'vocab', 'Listen: "Fantastic". What does this compliment express?', 'Nghe từ: "Fantastic". Lời khen ngợi này mang ý nghĩa gì?', { A: 'Tuyệt vời hảo hạng', B: 'Bình thường', C: 'Kém cỏi', D: 'Tạm được' }, 'A', 'Fantastic /fænˈtæstɪk/ nghĩa là tuyệt diệu, quá xuất sắc.', 'Fantastic'],
  ['listen-059', 'vocab', 'Listen: "Harmonious". What does this atmosphere feel like?', 'Nghe từ: "Harmonious". Bầu không khí này thế nào?', { A: 'Hài hòa êm dịu', B: 'Bất hòa xung đột', C: 'Căng thẳng', D: 'Rối loạn' }, 'A', 'Harmonious /hɑːˈməʊniəs/ nghĩa là hòa thuận, êm đẹp, hài hòa.', 'Harmonious'],
];

listeningData.forEach(([id, topic, prompt, promptVi, choices, correct, explanation, audioText]) => {
  addQ(id, topic, 'listening', 2, prompt, promptVi, choices, correct, explanation, 15, { audioText });
});

// -------------------------------------------------------------
// 3. SPELLING BEE QUESTIONS (35 questions)
// -------------------------------------------------------------
const spellingData = [
  ['spell-013', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Acomodation', B: 'Accommodation', C: 'Acommodation', D: 'Accomodatoin' }, 'B', 'Accommodation có 2 chữ c và 2 chữ m.', 14],
  ['spell-014', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Definately', B: 'Definitely', C: 'Definetely', D: 'Definitly' }, 'B', 'Definitely có gốc "finite", viết đúng là d-e-f-i-n-i-t-e-l-y.', 14],
  ['spell-015', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Separate', B: 'Seperate', C: 'Separete', D: 'Seperete' }, 'A', 'Separate có chữ a ở giữa: s-e-p-A-r-a-t-e.', 14],
  ['spell-016', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Recieve', B: 'Receive', C: 'Receve', D: 'Recive' }, 'B', 'Quy tắc: i trước e ngoại trừ sau c (r-e-c-e-i-v-e).', 14],
  ['spell-017', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Embarras', B: 'Embarass', C: 'Embarrass', D: 'Embaras' }, 'C', 'Embarrass có 2 chữ r và 2 chữ s (e-m-b-a-r-r-a-s-s).', 14],
  ['spell-018', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Necessary', B: 'Neccessary', C: 'Necesary', D: 'Necessery' }, 'A', 'Necessary có 1 chữ c và 2 chữ s: n-e-c-e-s-s-a-r-y.', 14],
  ['spell-019', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Rythm', B: 'Rhythm', C: 'Rhytm', D: 'Rhythym' }, 'B', 'Rhythm (nhịp điệu) viết đúng là r-h-y-t-h-m.', 14],
  ['spell-020', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Occurrance', B: 'Occurence', C: 'Occurrence', D: 'Ocurrence' }, 'C', 'Occurrence có 2 chữ c và 2 chữ r: o-c-c-u-r-r-e-n-c-e.', 14],
  ['spell-021', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Tommorow', B: 'Tomorrow', C: 'Tomorow', D: 'Tommorrow' }, 'B', 'Tomorrow có 1 chữ m và 2 chữ r: t-o-m-o-r-r-o-w.', 14],
  ['spell-022', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Privilege', B: 'Priviledge', C: 'Privelege', D: 'Privilige' }, 'A', 'Privilege (đặc ân) không có chữ d: p-r-i-v-i-l-e-g-e.', 14],
  ['spell-023', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Wednesday', B: 'Wenesday', C: 'Wedensday', D: 'Wensday' }, 'A', 'Wednesday (thứ Tư) có chữ d câm: w-e-d-n-e-s-d-a-y.', 14],
  ['spell-024', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Calender', B: 'Calendar', C: 'Celendar', D: 'Calandar' }, 'B', 'Calendar (lịch) kết thúc bằng -ar: c-a-l-e-n-d-a-r.', 14],
  ['spell-025', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Buisness', B: 'Business', C: 'Bussiness', D: 'Busyness' }, 'B', 'Business viết đúng là b-u-s-i-n-e-s-s.', 14],
  ['spell-026', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Foreign', B: 'Foriegn', C: 'Forein', D: 'Foreing' }, 'A', 'Foreign (nước ngoài) có e trước i: f-o-r-e-i-g-n.', 14],
  ['spell-027', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Gaurarantee', B: 'Garantee', C: 'Guarantee', D: 'Guarenty' }, 'C', 'Guarantee (bảo đảm) viết đúng là g-u-a-r-a-n-t-e-e.', 14],
  ['spell-028', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Beleive', B: 'Believe', C: 'Belive', D: 'Beleeve' }, 'B', 'Believe (tin tưởng) có i trước e: b-e-l-i-e-v-e.', 14],
  ['spell-029', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Conscious', B: 'Conshious', C: 'Conscius', D: 'Consious' }, 'A', 'Conscious (tỉnh táo, có ý thức) là c-o-n-s-c-i-o-u-s.', 14],
  ['spell-030', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Colleague', B: 'Coleague', C: 'Collegue', D: 'Collaegue' }, 'A', 'Colleague (đồng nghiệp) có 2 chữ l: c-o-l-l-e-a-g-u-e.', 14],
  ['spell-031', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Discipline', B: 'Descipline', C: 'Disipline', D: 'Disciplin' }, 'A', 'Discipline (kỷ luật) có sc: d-i-s-c-i-p-l-i-n-e.', 14],
  ['spell-032', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Environment', B: 'Enviroment', C: 'Environement', D: 'Enviromental' }, 'A', 'Environment có chữ n ở giữa: e-n-v-i-r-o-n-m-e-n-t.', 14],
  ['spell-033', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Exaggerate', B: 'Exagerate', C: 'Exaggurate', D: 'Exagerade' }, 'A', 'Exaggerate (phóng đại) có 2 chữ g: e-x-a-g-g-e-r-a-t-e.', 14],
  ['spell-034', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Fascinating', B: 'Facinating', C: 'Fasninating', D: 'Fascinatting' }, 'A', 'Fascinating (lôi cuốn) có sc: f-a-s-c-i-n-a-t-i-n-g.', 14],
  ['spell-035', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Government', B: 'Goverment', C: 'Governmant', D: 'Governmet' }, 'A', 'Government có chữ n: g-o-v-e-r-n-m-e-n-t.', 14],
  ['spell-036', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Grammar', B: 'Grammer', C: 'Gramar', D: 'Gramer' }, 'A', 'Grammar (ngữ pháp) kết thúc bằng -ar: g-r-a-m-m-a-r.', 14],
  ['spell-037', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Harrass', B: 'Harass', C: 'Haras', D: 'Harasse' }, 'B', 'Harass (quấy rầy) có 1 chữ r và 2 chữ s: h-a-r-a-s-s.', 14],
  ['spell-038', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Hierarchy', B: 'Heirarchy', C: 'Hierarcy', D: 'Hyerarchy' }, 'A', 'Hierarchy (thứ bậc) viết đúng là h-i-e-r-a-r-c-h-y.', 14],
  ['spell-039', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Independent', B: 'Independant', C: 'Indipendent', D: 'Independunt' }, 'A', 'Independent kết thúc bằng -ent: i-n-d-e-p-e-n-d-e-n-t.', 14],
  ['spell-040', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Intelligence', B: 'Intellegence', C: 'Inteligence', D: 'Intelligance' }, 'A', 'Intelligence có 2 chữ l và kết thúc -ence: i-n-t-e-l-l-i-g-e-n-c-e.', 14],
  ['spell-041', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Judgement', B: 'Judgment', C: 'Judgmant', D: 'Both A & B' }, 'D', 'Cả Judgement (Anh-Anh) và Judgment (Anh-Mỹ) đều được chấp nhận.', 14],
  ['spell-042', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Liaison', B: 'Liason', C: 'Liasion', D: 'Liaizon' }, 'A', 'Liaison (sự liên lạc) có 2 chữ i: l-i-a-i-s-o-n.', 14],
  ['spell-043', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Mischevious', B: 'Mischievous', C: 'Mischevous', D: 'Mischivous' }, 'B', 'Mischievous (tinh nghịch) không có chữ i sau v: m-i-s-c-h-i-e-v-o-u-s.', 14],
  ['spell-044', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Noticeable', B: 'Noticable', C: 'Noticeble', D: 'Notisable' }, 'A', 'Noticeable giữ lại chữ e: n-o-t-i-c-e-a-b-l-e.', 14],
  ['spell-045', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Millennium', B: 'Millenium', C: 'Milennium', D: 'Milenium' }, 'A', 'Millennium (thiên niên kỷ) có 2 l và 2 m: m-i-l-l-e-n-n-i-u-m.', 14],
  ['spell-046', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Pronunciation', B: 'Pronounciation', C: 'Pronunsiation', D: 'Pronunsation' }, 'A', 'Pronunciation có nun (không có o): p-r-o-n-u-n-c-i-a-t-i-o-n.', 14],
  ['spell-047', 'Which word is spelled correctly?', 'Từ nào viết chính tả đúng?', { A: 'Restaurant', B: 'Resturant', C: 'Restaraunt', D: 'Resterant' }, 'A', 'Restaurant (nhà hàng) viết đúng là r-e-s-t-a-u-r-a-n-t.', 14],
];

spellingData.forEach(([id, prompt, promptVi, choices, correct, explanation, durationSec]) => {
  addQ(id, 'spelling', 'spelling', 3, prompt, promptVi, choices, correct, explanation, durationSec);
});

// -------------------------------------------------------------
// 4. TEAM BATTLE QUESTIONS (40 questions)
// -------------------------------------------------------------
const teamData = [
  ['team-001', 'vocab', 'What is the opposite of "Victory"?', 'Từ trái nghĩa với "Victory" (Chiến thắng) là gì?', { A: 'Defeat', B: 'Success', C: 'Triumph', D: 'Glory' }, 'A', 'Defeat là sự thất bại, đối lập với Victory.', 12],
  ['team-002', 'grammar', 'Choose the correct preposition: We are proud ___ our team.', 'Chọn giới từ đúng: We are proud ___ our team.', { A: 'in', B: 'of', C: 'at', D: 'with' }, 'B', 'Cụm từ "proud of" có nghĩa là tự hào về.', 12],
  ['team-003', 'idioms', 'What does "Team spirit" mean?', 'Cụm từ "Team spirit" có nghĩa là gì?', { A: 'Tinh thần đồng đội', B: 'Con ma đội bóng', C: 'Lòng ghen tị', D: 'Sự bỏ cuộc' }, 'A', 'Team spirit là tinh thần đoàn kết đồng đội.', 12],
  ['team-004', 'vocab', 'Which word means "having no fear"?', 'Từ nào có nghĩa là "không sợ hãi"?', { A: 'Fearless', B: 'Fearful', C: 'Timid', D: 'Anxious' }, 'A', 'Fearless (hậu tố -less mang nghĩa không có) là không sợ hãi.', 12],
  ['team-005', 'grammar', 'Complete: Both teams ___ playing exceptionally well today.', 'Điền từ: Both teams ___ playing exceptionally well today.', { A: 'is', B: 'are', C: 'am', D: 'be' }, 'B', 'Chủ ngữ "Both teams" là số nhiều, dùng động từ to be "are".', 12],
  ['team-006', 'vocab', 'What is the synonym of "Champion"?', 'Từ đồng nghĩa với "Champion" (Nhà vô địch) là gì?', { A: 'Winner', B: 'Loser', C: 'Spectator', D: 'Referee' }, 'A', 'Winner và Champion đều là người chiến thắng vẻ vang.', 12],
  ['team-007', 'idioms', 'What does "Pass the torch" mean?', 'Thành ngữ "Pass the torch" có nghĩa là gì?', { A: 'Truyền lại ngọn đuốc/trọng trách', B: 'Làm tắt lửa', C: 'Chạy đua', D: 'Ném đuốc' }, 'A', 'Pass the torch là trao lại sứ mệnh, trọng trách cho thế hệ kế tiếp.', 12],
  ['team-008', 'grammar', 'Complete: Neither Red ___ Blue gave up until the final second.', 'Điền liên từ đi với "Neither": Neither Red ___ Blue...', { A: 'or', B: 'nor', C: 'and', D: 'but' }, 'B', 'Cặp liên từ chuẩn là: Neither ... nor (Không ... cũng không).', 12],
  ['team-009', 'vocab', 'What does "Score" mean in a football match?', 'Từ "Score" trong một trận bóng đá có nghĩa là gì?', { A: 'Ghi bàn/Tỉ số', B: 'Ném bóng', C: 'Phạm lỗi', D: 'Nghỉ giải lao' }, 'A', 'Score vừa là danh từ tỉ số, vừa là động từ ghi bàn.', 12],
  ['team-010', 'idioms', 'What does "Bring your A-game" mean?', 'Thành ngữ "Bring your A-game" có ý nghĩa gì?', { A: 'Chơi với phong độ tốt nhất', B: 'Mang theo trò chơi', C: 'Chơi chữ cái A', D: 'Gian lận' }, 'A', 'Bring your A-game nghĩa là thể hiện hết khả năng xuất sắc nhất của mình.', 12],
  ['team-011', 'vocab', 'What is the opposite of "Weakness"?', 'Từ trái nghĩa với "Weakness" (Điểm yếu) là gì?', { A: 'Strength', B: 'Fault', C: 'Defect', D: 'Struggle' }, 'A', 'Strength là sức mạnh, điểm mạnh đối lập với Weakness.', 12],
  ['team-012', 'grammar', 'Complete: If our team wins, we ___ celebrate together.', 'Điền từ câu điều kiện loại 1: If our team wins, we ___ celebrate...', { A: 'will', B: 'would', C: 'had', D: 'were' }, 'A', 'Câu điều kiện loại 1 mệnh đề chính dùng "will + V".', 12],
  ['team-013', 'vocab', 'Who makes the official decisions in a football match?', 'Ai là người đưa ra quyết định công tâm trong trận đấu?', { A: 'Referee', B: 'Coach', C: 'Goalkeeper', D: 'Cheerleader' }, 'A', 'Referee là trọng tài điều khiển trận đấu.', 12],
  ['team-014', 'idioms', 'What does "Join hands" symbolize?', 'Cụm từ "Join hands" tượng trưng cho điều gì?', { A: 'Chung tay hợp tác', B: 'Bắt tay từ biệt', C: 'Vỗ tay tán thưởng', D: 'Bẻ ngón tay' }, 'A', 'Join hands là cùng chung tay, hợp tác thực hiện mục tiêu.', 12],
  ['team-015', 'vocab', 'What is a "Trophy"?', 'Từ "Trophy" có nghĩa là gì?', { A: 'Cúp vô địch', B: 'Quả bóng', C: 'Chiếc còi', D: 'Tấm vé' }, 'A', 'Trophy là chiếc cúp vinh quang trao cho nhà vô địch.', 12],
  ['team-016', 'grammar', 'Complete: Let\'s do our best, ___ we?', 'Hoàn thành câu hỏi đuôi với "Let\'s": Let\'s do our best, ___ we?', { A: 'shall', B: 'will', C: 'can', D: 'do' }, 'A', 'Sau "Let\'s..." câu hỏi đuôi chuẩn luôn là "shall we?".', 12],
  ['team-017', 'vocab', 'What does "Rival" mean?', 'Từ "Rival" có nghĩa là gì?', { A: 'Đối thủ cạnh tranh', B: 'Người hâm mộ', C: 'Huấn luyện viên', D: 'Nhà tài trợ' }, 'A', 'Rival là đối thủ ngang tài ngang sức trên đấu trường.', 12],
  ['team-018', 'idioms', 'What does "Keep your chin up" mean?', 'Thành ngữ "Keep your chin up" dùng để làm gì?', { A: 'Động viên giữ vững tinh thần', B: 'Ngửa cổ lên trời', C: 'Tránh đòn đánh', D: 'Ngủ gật' }, 'A', 'Keep your chin up là lời động viên đừng nản chí, hãy lạc quan lên.', 12],
  ['team-019', 'vocab', 'What word describes working together toward a common goal?', 'Từ nào diễn tả việc cùng hợp tác vì mục tiêu chung?', { A: 'Collaboration', B: 'Isolation', C: 'Disagreement', D: 'Separation' }, 'A', 'Collaboration là sự cộng tác, phối hợp hiệu quả.', 12],
  ['team-020', 'grammar', 'Complete: The team played ___ than yesterday.', 'Điền dạng so sánh hơn: The team played ___ than yesterday.', { A: 'better', B: 'gooder', C: 'more good', D: 'best' }, 'A', 'Dạng so sánh hơn của trạng từ "well" là "better".', 12],
  ['team-021', 'vocab', 'What is the person leading a team called?', 'Người chỉ huy, đội trưởng của một tập thể gọi là gì?', { A: 'Captain', B: 'Audience', C: 'Passenger', D: 'Customer' }, 'A', 'Captain là đội trưởng hoặc thuyền trưởng.', 12],
  ['team-022', 'idioms', 'What does "Level playing field" mean?', 'Thành ngữ "Level playing field" có nghĩa là gì?', { A: 'Sân chơi bình đẳng công bằng', B: 'Sân cỏ bằng phẳng', C: 'Sân bóng mini', D: 'Sân vận động mái vòm' }, 'A', 'Level playing field chỉ điều kiện thi đấu công bằng cho mọi bên.', 12],
  ['team-023', 'grammar', 'Complete: One of the players ___ injured during the sprint.', 'Điền từ: One of the players ___ injured during the sprint.', { A: 'was', B: 'were', C: 'are', D: 'be' }, 'A', 'Chủ ngữ "One of + N số nhiều" có trọng tâm là "One" (số ít), dùng "was".', 12],
  ['team-024', 'vocab', 'What is the opposite of "Fair"?', 'Từ trái nghĩa với "Fair" (Công bằng) là gì?', { A: 'Unfair', B: 'Honest', C: 'Equal', D: 'Just' }, 'A', 'Unfair là bất công, thiếu công bằng.', 12],
  ['team-025', 'idioms', 'What does "Call the shots" mean?', 'Thành ngữ "Call the shots" có nghĩa là gì?', { A: 'Chỉ huy, đưa ra quyết định', B: 'Bắn súng', C: 'Gọi điện thoại', D: 'Uống nước ngọt' }, 'A', 'Call the shots là người nắm quyền chỉ huy, ra quyết định.', 12],
  ['team-026', 'vocab', 'What do spectators do when a team scores a great goal?', 'Khán giả làm gì khi đội bóng ghi bàn thắng đẹp?', { A: 'Cheer', B: 'Sleep', C: 'Complain', D: 'Whisper' }, 'A', 'Cheer là reo hò, cổ vũ nhiệt tình.', 12],
  ['team-027', 'grammar', 'Choose the correct form: It is important that he ___ on time.', 'Thể giả định thức: It is important that he ___ on time.', { A: 'be', B: 'is', C: 'was', D: 'being' }, 'A', 'Cấu trúc bàng quan thức (subjunctive): It is important that S + (should) be...', 12],
  ['team-028', 'vocab', 'What is an "Underdog"?', 'Thuật ngữ "Underdog" trong thi đấu nghĩa là gì?', { A: 'Đội bị đánh giá yếu thế hơn', B: 'Con chó dưới gầm giường', C: 'Người thắng cuộc', D: 'Trọng tài biên' }, 'A', 'Underdog là đội chiếu dưới, bị đánh giá yếu hơn trước trận.', 12],
  ['team-029', 'idioms', 'What does "Game changer" mean?', 'Cụm từ "Game changer" chỉ điều gì?', { A: 'Yếu tố thay đổi cục diện', B: 'Người đổi đĩa game', C: 'Trò chơi bị hỏng', D: 'Luật chơi mới' }, 'A', 'Game changer là yếu tố tạo ra bước ngoặt thay đổi hoàn toàn tình thế.', 12],
  ['team-030', 'vocab', 'What does "Unbeaten" mean?', 'Từ "Unbeaten" miêu tả thành tích nào?', { A: 'Bất bại', B: 'Bị đánh đòn', C: 'Thua cuộc', D: 'Rút lui' }, 'A', 'Unbeaten là bất bại, chưa từng nếm mùi thất bại.', 12],
  ['team-031', 'grammar', 'Complete: Hardly had the whistle blown ___ the crowd erupted.', 'Cấu trúc đảo ngữ: Hardly had the whistle blown ___ the crowd erupted.', { A: 'when', B: 'than', C: 'then', D: 'after' }, 'A', 'Cặp liên từ đảo ngữ chuẩn: Hardly had S + V3 WHEN S + V2.', 12],
  ['team-032', 'vocab', 'What is the spirit of fair play called?', 'Tinh thần thượng võ, chơi đẹp trong thể thao gọi là gì?', { A: 'Sportsmanship', B: 'Selfishness', C: 'Recklessness', D: 'Cowardice' }, 'A', 'Sportsmanship là tinh thần thể thao cao thượng, fair-play.', 12],
  ['team-033', 'idioms', 'What does "Hit the target" mean?', 'Cụm từ "Hit the target" nghĩa là gì?', { A: 'Bắn trúng đích/Đạt mục tiêu', B: 'Lệch hướng', C: 'Bỏ lỡ cơ hội', D: 'Lùi bước' }, 'A', 'Hit the target là bắn trúng hồng tâm, đạt mục tiêu đề ra.', 12],
  ['team-034', 'vocab', 'What is a "Penalty" in sports?', 'Từ "Penalty" chỉ điều gì?', { A: 'Hình phạt / Quả phạt đền', B: 'Bàn thắng đẹp', C: 'Phần thưởng thêm', D: 'Cầu thủ dự bị' }, 'A', 'Penalty là quả phạt đền hoặc hình phạt do lỗi vi phạm.', 12],
  ['team-035', 'grammar', 'Complete: Not only Red but also Blue ___ passionately.', 'Hòa hợp chủ vị với "Not only... but also...": ...Blue ___ passionately.', { A: 'fights', B: 'fight', C: 'are fighting', D: 'have fought' }, 'A', 'Quy tắc: Động từ hòa hợp theo chủ ngữ gần nhất (Blue - số ít -> fights).', 12],
  ['team-036', 'vocab', 'What does "Comeback" mean in a match?', 'Từ "Comeback" trong trận đấu nghĩa là gì?', { A: 'Lội ngược dòng ngoạn mục', B: 'Bỏ về giữa chừng', C: 'Đổi sân', D: 'Chấn thương' }, 'A', 'Comeback là màn lội ngược dòng lật ngược thế cờ kỳ diệu.', 12],
  ['team-037', 'idioms', 'What does "Blow the whistle" mean literally in football?', 'Nghĩa đen của "Blow the whistle" trong bóng đá là gì?', { A: 'Thổi còi', B: 'Hát bài ca', C: 'Mất tập trung', D: 'Ghi bàn' }, 'A', 'Blow the whistle là trọng tài cất tiếng còi kết thúc hoặc dừng trận.', 12],
  ['team-038', 'vocab', 'What does "Tactics" mean?', 'Từ "Tactics" có nghĩa là gì?', { A: 'Chiến thuật thi đấu', B: 'Đồng phục', C: 'Sân bãi', D: 'Thời tiết' }, 'A', 'Tactics là chiến thuật, sách lược thi đấu được toan tính kỹ.', 12],
  ['team-039', 'grammar', 'Complete: Each player on the team ___ a special role.', 'Điền từ: Each player on the team ___ a special role.', { A: 'has', B: 'have', C: 'are having', D: 'having' }, 'A', 'Chủ ngữ bắt đầu bằng "Each + N số ít" luôn đi với động từ số ít "has".', 12],
  ['team-040', 'vocab', 'What is the ultimate celebration after winning the final?', 'Hoạt động ăn mừng đỉnh cao sau khi vô địch là gì?', { A: 'Lifting the trophy', B: 'Cleaning the locker room', C: 'Sitting in silence', D: 'Packing bags' }, 'A', 'Lifting the trophy là khoảnh khắc nâng cao chiếc cúp vàng vô địch.', 12],
];

teamData.forEach(([id, topic, prompt, promptVi, choices, correct, explanation, durationSec]) => {
  addQ(id, topic, 'team', 2, prompt, promptVi, choices, correct, explanation, durationSec);
});

// -------------------------------------------------------------
// 5. SURVIVAL CLASS QUESTIONS (40 questions - Increasing difficulty)
// -------------------------------------------------------------
const survivalData = [
  ['surv-001', 'vocab', 'Which organ pumps blood throughout the human body?', 'Cơ quan nào bơm máu đi khắp cơ thể con người?', { A: 'Heart', B: 'Lungs', C: 'Liver', D: 'Stomach' }, 'A', 'Heart là quả tim đập liên hồi bơm máu nuôi cơ thể.', 10, 1],
  ['surv-002', 'nature', 'What is the hardest natural substance on Earth?', 'Khoáng vật tự nhiên cứng nhất trên Trái Đất là gì?', { A: 'Diamond', B: 'Iron', C: 'Gold', D: 'Quartz' }, 'A', 'Diamond (Kim cương) là chất tự nhiên cứng nhất theo thang Mohs.', 10, 2],
  ['surv-003', 'grammar', 'Identify the past participle of "Swim":', 'Phân từ hai (V3) của động từ "Swim" là gì?', { A: 'Swum', B: 'Swam', C: 'Swimmed', D: 'Swimming' }, 'A', 'Động từ bất quy tắc: Swim -> Swam -> Swum.', 10, 2],
  ['surv-004', 'science', 'Water boils at what temperature at standard sea level?', 'Nước sôi ở bao nhiêu độ C ở áp suất tiêu chuẩn?', { A: '100°C', B: '90°C', C: '80°C', D: '120°C' }, 'A', 'Nước tinh khiết sôi ở 100 độ C tại mực nước biển.', 10, 1],
  ['surv-005', 'vocab', 'What is a baby kangaroo called?', 'Chuột túi con mới sinh gọi là gì trong tiếng Anh?', { A: 'Joey', B: 'Cub', C: 'Puppy', D: 'Kitten' }, 'A', 'Joey là tên gọi của chuột túi con nằm trong túi mẹ.', 10, 2],
  ['surv-006', 'grammar', 'Complete: Had I known the answer, I ___ told you.', 'Câu điều kiện loại 3 đảo ngữ: Had I known..., I ___ told you.', { A: 'would have', B: 'will have', C: 'would', D: 'had' }, 'A', 'Đảo ngữ loại 3: Had + S + V3, S + would have + V3.', 10, 3],
  ['surv-007', 'geography', 'What is the largest continent by both land area and population?', 'Châu lục lớn nhất thế giới cả về diện tích và dân số?', { A: 'Asia', B: 'Africa', C: 'Europe', D: 'North America' }, 'A', 'Asia (Châu Á) là châu lục rộng lớn và đông dân nhất.', 10, 2],
  ['surv-008', 'science', 'Which gas do plants absorb from the air for photosynthesis?', 'Thực vật hấp thụ khí nào từ không khí để quang hợp?', { A: 'Carbon dioxide', B: 'Oxygen', C: 'Nitrogen', D: 'Helium' }, 'A', 'Cây xanh hấp thụ Carbon dioxide (CO2) và nhả khí Oxy.', 10, 2],
  ['surv-009', 'vocab', 'What is the synonym of "Ephemeral"?', 'Từ đồng nghĩa với "Ephemeral" (Phù du, ngắn ngủi) là gì?', { A: 'Short-lived', B: 'Eternal', C: 'Permanent', D: 'Enduring' }, 'A', 'Ephemeral nghĩa là sớm nở tối tàn, phù du (Short-lived).', 10, 4],
  ['surv-010', 'literature', 'Who wrote the famous tragedy "Romeo and Juliet"?', 'Đại văn hào nào đã viết kiệt tác "Romeo và Juliet"?', { A: 'William Shakespeare', B: 'Charles Dickens', C: 'Mark Twain', D: 'Jane Austen' }, 'A', 'William Shakespeare là tác giả của vở kịch bất hủ này.', 10, 2],
  ['surv-011', 'grammar', 'Choose the sentence with correct punctuation:', 'Chọn câu có dấu câu chính xác:', { A: 'Although it rained, we went out.', B: 'Although it rained we went out,', C: 'Although, it rained we went out.', D: 'Although it rained; we went out.' }, 'A', 'Mệnh đề phụ bắt đầu bằng Although đứng đầu câu cần có dấu phẩy ngăn cách.', 10, 2],
  ['surv-012', 'space', 'What is the closest planet to the Sun in our solar system?', 'Hành tinh nào nằm gần Mặt Trời nhất trong hệ Mặt Trời?', { A: 'Mercury', B: 'Venus', C: 'Mars', D: 'Jupiter' }, 'A', 'Mercury (Sao Thủy) là hành tinh gần Mặt Trời nhất.', 10, 2],
  ['surv-013', 'vocab', 'What is the fear of heights called in English?', 'Hội chứng sợ độ cao gọi là gì trong tiếng Anh?', { A: 'Acrophobia', B: 'Claustrophobia', C: 'Arachnophobia', D: 'Hydrophobia' }, 'A', 'Acrophobia là chứng sợ độ cao.', 10, 4],
  ['surv-014', 'history', 'In which century was the printing press invented in Europe?', 'Máy in chữ rời được phát minh ở châu Âu vào thế kỷ nào?', { A: '15th century', B: '13th century', C: '17th century', D: '19th century' }, 'A', 'Johannes Gutenberg phát minh máy in vào khoảng năm 1440 (thế kỷ 15).', 10, 3],
  ['surv-015', 'grammar', 'Which word is an adverb in: "She sang very sweetly"?', 'Từ nào là trạng từ chỉ mức độ trong câu trên?', { A: 'very', B: 'sang', C: 'she', D: 'sweetly' }, 'A', '"Very" là trạng từ chỉ mức độ bổ nghĩa cho trạng từ "sweetly".', 10, 2],
  ['surv-016', 'science', 'What chemical element has the symbol "Au"?', 'Nguyên tố hóa học nào mang ký hiệu "Au"?', { A: 'Gold', B: 'Silver', C: 'Iron', D: 'Copper' }, 'A', 'Au xuất phát từ tiếng Latin "Aurum", nghĩa là Vàng (Gold).', 10, 2],
  ['surv-017', 'vocab', 'What is the opposite of "Abundant"?', 'Từ trái nghĩa với "Abundant" (Dồi dào, phong phú) là gì?', { A: 'Scarce', B: 'Plentiful', C: 'Generous', D: 'Vast' }, 'A', 'Scarce nghĩa là khan hiếm, ít ỏi.', 10, 3],
  ['surv-018', 'nature', 'Which is the fastest land animal in a short sprint?', 'Loài động vật chạy trên cạn nhanh nhất thế giới khi bứt tốc?', { A: 'Cheetah', B: 'Lion', C: 'Gazelle', D: 'Horse' }, 'A', 'Cheetah (Báo săn) có thể đạt tốc độ hơn 100 km/h.', 10, 1],
  ['surv-019', 'grammar', 'Identify the passive voice sentence:', 'Chọn câu được viết ở thể bị động:', { A: 'The letter was sent yesterday.', B: 'He sent the letter yesterday.', C: 'She is writing a letter.', D: 'They will send the letter.' }, 'A', '"The letter was sent..." có cấu trúc be + V3 thể hiện bị động.', 10, 2],
  ['surv-020', 'vocab', 'What does the prefix "Mega-" mean?', 'Tiền tố "Mega-" trong tiếng Anh có nghĩa là gì?', { A: 'Great / Million', B: 'Tiny / Small', C: 'Negative / Not', D: 'Before / Prior' }, 'A', 'Mega- bắt nguồn từ Hy Lạp nghĩa là to lớn, vĩ đại hoặc 1 triệu (Megabyte).', 10, 3],
  ['surv-021', 'ocean', 'Which trench is the deepest oceanic trench on Earth?', 'Rãnh đại dương nào sâu nhất trên Trái Đất?', { A: 'Mariana Trench', B: 'Java Trench', C: 'Puerto Rico Trench', D: 'Tonga Trench' }, 'A', 'Rãnh Mariana ở Thái Bình Dương sâu gần 11.000 mét.', 10, 3],
  ['surv-022', 'grammar', 'Complete: Neither of the boys ___ finished his homework.', 'Hòa hợp chủ vị: Neither of the boys ___ finished his homework.', { A: 'has', B: 'have', C: 'are', D: 'were' }, 'A', '"Neither of + N số nhiều" theo ngữ pháp chuẩn đi với động từ số ít "has".', 10, 3],
  ['surv-023', 'vocab', 'What does "Ubiquitous" mean?', 'Từ vựng học thuật "Ubiquitous" có nghĩa là gì?', { A: 'Present everywhere', B: 'Extremely rare', C: 'Dangerous', D: 'Fragile' }, 'A', 'Ubiquitous nghĩa là có mặt ở khắp mọi nơi (omnipresent).', 10, 5],
  ['surv-024', 'space', 'How many minutes does sunlight take to reach Earth?', 'Ánh sáng Mặt Trời mất khoảng bao nhiêu phút để đến Trái Đất?', { A: 'About 8 minutes', B: 'About 1 minute', C: 'About 20 minutes', D: 'About 1 hour' }, 'A', 'Ánh sáng di chuyển quãng đường 150 triệu km trong khoảng 8 phút 20 giây.', 10, 2],
  ['surv-025', 'grammar', 'Which sentence uses the subjunctive mood correctly?', 'Câu nào sử dụng thức giả định chuẩn xác?', { A: 'I suggest that she study harder.', B: 'I suggest that she studies harder.', C: 'I suggest that she studied harder.', D: 'I suggest that she is studying.' }, 'A', 'Sau "suggest that" động từ luôn ở dạng nguyên thể không to: "study".', 10, 4],
  ['surv-026', 'vocab', 'What is a group of wolves called in English?', 'Một bầy sói đi săn gọi là gì trong tiếng Anh?', { A: 'Pack', B: 'Flock', C: 'Herd', D: 'School' }, 'A', 'A pack of wolves nghĩa là một đàn chó sói.', 10, 2],
  ['surv-027', 'nature', 'What is the largest living mammal on Earth?', 'Loài động vật có vú lớn nhất còn sống trên Trái Đất?', { A: 'Blue whale', B: 'African elephant', C: 'Giraffe', D: 'Colossal squid' }, 'A', 'Blue whale (Cá voi xanh) có thể dài tới 30m và nặng gần 200 tấn.', 10, 1],
  ['surv-028', 'grammar', 'Identify the gerund in: "Swimming keeps her healthy."', 'Xác định danh động từ (Gerund) trong câu trên:', { A: 'Swimming', B: 'keeps', C: 'her', D: 'healthy' }, 'A', '"Swimming" đứng đầu câu làm chủ ngữ chính là một Gerund.', 10, 2],
  ['surv-029', 'science', 'Which blood cells fight infections and diseases?', 'Tế bào máu nào đóng vai trò tiêu diệt vi khuẩn gây bệnh?', { A: 'White blood cells', B: 'Red blood cells', C: 'Platelets', D: 'Plasma' }, 'A', 'Bạch cầu (White blood cells) là dũng sĩ bảo vệ hệ miễn dịch.', 10, 2],
  ['surv-030', 'vocab', 'What is the meaning of "Serendipity"?', 'Từ ngữ thi vị "Serendipity" mang ý nghĩa gì?', { A: 'Finding good things by chance', B: 'Extreme sadness', C: 'A sudden storm', D: 'A deep regret' }, 'A', 'Serendipity là sự may mắn tình cờ tìm thấy điều tốt đẹp.', 10, 4],
  ['surv-031', 'history', 'Which ancient wonder was located in Alexandria, Egypt?', 'Kỳ quan cổ đại nào từng tọa lạc tại Alexandria, Ai Cập?', { A: 'Lighthouse of Alexandria', B: 'Hanging Gardens', C: 'Colossus of Rhodes', D: 'Temple of Artemis' }, 'A', 'Hải đăng Alexandria là một trong 7 kỳ quan thế giới cổ đại.', 10, 3],
  ['surv-032', 'grammar', 'Choose the correct inversion: Seldom ___ such bravery.', 'Đảo ngữ với phó từ phủ định Seldom: Seldom ___ such bravery.', { A: 'have I seen', B: 'I have seen', C: 'I saw', D: 'did I saw' }, 'A', 'Đảo ngữ: Seldom + trợ động từ + S + V chính (have I seen).', 10, 4],
  ['surv-033', 'vocab', 'What is the antonym of "Meticulous"?', 'Từ trái nghĩa với "Meticulous" (Tỉ mỉ, cẩn thận) là gì?', { A: 'Careless', B: 'Thorough', C: 'Precise', D: 'Detailed' }, 'A', 'Careless (cẩu thả, bất cẩn) đối lập với Meticulous.', 10, 3],
  ['surv-034', 'space', 'Which galaxy contains our Solar System?', 'Thiên hà chứa hệ Mặt Trời của chúng ta tên là gì?', { A: 'Milky Way', B: 'Andromeda', C: 'Triangulum', D: 'Whirlpool' }, 'A', 'Milky Way (Dải Ngân Hà) là ngôi nhà vũ trụ của chúng ta.', 10, 1],
  ['surv-035', 'grammar', 'What type of conditional is: "If it had rained, we would have stayed home"?', 'Câu trên thuộc loại câu điều kiện nào?', { A: 'Third conditional', B: 'First conditional', C: 'Second conditional', D: 'Zero conditional' }, 'A', 'Cấu trúc Had + V3 ... would have + V3 là câu điều kiện loại 3.', 10, 2],
  ['surv-036', 'science', 'What is the primary gas found in Earth\'s atmosphere?', 'Khí chiếm tỉ lệ lớn nhất trong bầu khí quyển Trái Đất là gì?', { A: 'Nitrogen (approx 78%)', B: 'Oxygen (approx 21%)', C: 'Carbon dioxide', D: 'Argon' }, 'A', 'Khí Nitơ chiếm khoảng 78% bầu khí quyển Trái Đất.', 10, 2],
  ['surv-037', 'vocab', 'What does "Tenacious" mean?', 'Từ vựng "Tenacious" miêu tả tính cách gì?', { A: 'Holding firmly / Persistent', B: 'Easily broken', C: 'Timid', D: 'Careless' }, 'A', 'Tenacious là kiên trì bền bỉ, bám chặt không buông bỏ.', 10, 4],
  ['surv-038', 'nature', 'Which tree produces acorns as its fruit?', 'Cây gì sinh ra quả sồi (acorn) mà các chú sóc rất mê?', { A: 'Oak tree', B: 'Pine tree', C: 'Maple tree', D: 'Willow tree' }, 'A', 'Cây sồi (Oak tree) sinh ra những quả sồi nhỏ xinh.', 10, 2],
  ['surv-039', 'grammar', 'Complete: No sooner had we arrived ___ it started to pour.', 'Cấu trúc đảo ngữ: No sooner had we arrived ___ it started to pour.', { A: 'than', B: 'when', C: 'then', D: 'as' }, 'A', 'Cấu trúc chuẩn: No sooner had S + V3 THAN S + V2.', 10, 3],
  ['surv-040', 'vocab', 'You survived 40 trials! What is the Latin phrase for "Seize the day"?', 'Thành ngữ Latin nổi tiếng nào có nghĩa "Hãy nắm bắt ngày hôm nay"?', { A: 'Carpe Diem', B: 'Et Cetera', C: 'Ad Hoc', D: 'Vice Versa' }, 'A', 'Carpe Diem là lời nhắn nhủ hãy sống trọn vẹn từng khoảnh khắc hôm nay!', 10, 3],
];

survivalData.forEach(([id, topic, prompt, promptVi, choices, correct, explanation, durationSec, diff = 3]) => {
  addQ(id, topic, 'survival', diff, prompt, promptVi, choices, correct, explanation, durationSec);
});

// -------------------------------------------------------------
// 6. BOSS QUESTIONS (25 cooperative milestone questions)
// -------------------------------------------------------------
const bossData = [
  ['boss-001', 'trivia', 'CLASS CO-OP BOSS 1: Which country has the most natural lakes in the world?', 'CÂU HỎI TRÙM 1: Quốc gia nào sở hữu nhiều hồ nước tự nhiên nhất thế giới?', { A: 'Canada', B: 'Russia', C: 'USA', D: 'Brazil' }, 'A', 'Canada sở hữu hơn 60% tổng số hồ tự nhiên trên toàn thế giới!', 18],
  ['boss-002', 'idioms', 'CLASS CO-OP BOSS 2: What is the origin of "Bite the bullet"?', 'CÂU HỎI TRÙM 2: Thành ngữ "Bite the bullet" (Cắn răng chịu đựng) bắt nguồn từ đâu?', { A: 'Old military surgery without anesthesia', B: 'Hunting wolves in winter', C: 'A medieval eating competition', D: 'Pirates biting gold coins' }, 'A', 'Thời xưa khi thiếu thuốc mê trên chiến trường, thương binh cắn vào viên đạn để chịu đựng cơn đau.', 18],
  ['boss-003', 'language', 'CLASS CO-OP BOSS 3: What is the only letter that does not appear in any US state name?', 'CÂU HỎI TRÙM 3: Chữ cái duy nhất nào không xuất hiện trong tên của bất kỳ bang nào tại Mỹ?', { A: 'Q', B: 'X', C: 'Z', D: 'J' }, 'A', 'Chữ cái "Q" là chữ cái duy nhất không có trong tên của 50 bang nước Mỹ!', 18],
  ['boss-004', 'science', 'CLASS CO-OP BOSS 4: What is the only mammal capable of true sustained flight?', 'CÂU HỎI TRÙM 4: Loài thú (động vật có vú) duy nhất nào có khả năng bay thực sự?', { A: 'Bat', B: 'Flying squirrel', C: 'Sugar glider', D: 'Pigeon' }, 'A', 'Dơi (Bat) là loài thú duy nhất có cánh và bay lượn thực sự, không chỉ lượn như sóc bay.', 18],
  ['boss-005', 'history', 'CLASS CO-OP BOSS 5: Which ancient civilization built the famous city of Machu Picchu?', 'CÂU HỎI TRÙM 5: Nền văn minh cổ đại nào đã xây dựng thành phố Machu Picchu trên mây?', { A: 'Inca Empire', B: 'Maya Civilization', C: 'Aztec Empire', D: 'Olmec Culture' }, 'A', 'Đế chế Inca đã xây dựng kỳ quan Machu Picchu trên dãy Andes ở Peru vào thế kỷ 15.', 18],
  ['boss-006', 'vocab', 'CLASS CO-OP BOSS 6: What English word contains all 5 vowels in alphabetical order (A-E-I-O-U)?', 'CÂU HỎI TRÙM 6: Từ tiếng Anh nào chứa đủ cả 5 nguyên âm theo đúng thứ tự A-E-I-O-U?', { A: 'Facetious', B: 'Education', C: 'Dialogue', D: 'Sequent' }, 'A', 'Từ "Facetious" (vui vẻ, khôi hài) chứa đúng 5 nguyên âm: f-A-c-E-t-I-O-U-s!', 18],
  ['boss-007', 'nature', 'CLASS CO-OP BOSS 7: What color is the blood of an octopus?', 'CÂU HỎI TRÙM 7: Máu của loài bạch tuộc có màu gì?', { A: 'Blue', B: 'Red', C: 'Green', D: 'Yellow' }, 'A', 'Máu bạch tuộc có màu xanh lam vì chứa phân tử Hemocyanin gốc đồng thay vì sắt!', 18],
  ['boss-008', 'space', 'CLASS CO-OP BOSS 8: Which planet in our solar system rotates clockwise on its axis?', 'CÂU HỎI TRÙM 8: Hành tinh nào trong hệ Mặt Trời tự quay quanh trục theo chiều kim đồng hồ?', { A: 'Venus', B: 'Mars', C: 'Jupiter', D: 'Earth' }, 'A', 'Sao Kim (Venus) tự quay ngược chiều với hầu hết các hành tinh khác trong hệ Mặt Trời.', 18],
  ['boss-009', 'literature', 'CLASS CO-OP BOSS 9: What is the longest word in major English dictionaries?', 'CÂU HỎI TRÙM 9: Từ dài nhất có 45 chữ cái trong từ điển tiếng Anh chỉ bệnh gì?', { A: 'A lung disease from inhaling fine ash', B: 'A deep ocean sea monster', C: 'A medieval castle gate', D: 'A fear of long words' }, 'A', '"Pneumonoultramicroscopicsilicovolcanoconiosis" chỉ bệnh bụi phổi do hít phải tro bụi silica!', 18],
  ['boss-010', 'geography', 'CLASS CO-OP BOSS 10: Which is the world\'s largest island that is not a continent?', 'CÂU HỎI TRÙM 10: Hòn đảo lớn nhất thế giới (không phải là một lục địa) là đảo nào?', { A: 'Greenland', B: 'Madagascar', C: 'Borneo', D: 'New Guinea' }, 'A', 'Greenland (Đảo Xanh) là hòn đảo lớn nhất hành tinh với diện tích hơn 2,1 triệu km2.', 18],
  ['boss-011', 'trivia', 'CLASS CO-OP BOSS 11: Honey found in ancient Egyptian tombs after 3,000 years is still:', 'CÂU HỎI TRÙM 11: Mật ong 3.000 năm tuổi tìm thấy trong hầm mộ Pharaoh cổ đại vẫn:', { A: 'Edible and unspoiled', B: 'Turned into black stone', C: 'Extremely poisonous', D: 'Completely evaporated' }, 'A', 'Mật ong nguyên chất có độ ẩm thấp và tính kháng khuẩn cao nên không bao giờ bị thiu!', 18],
  ['boss-012', 'idioms', 'CLASS CO-OP BOSS 12: What does the idiom "Barking up the wrong tree" mean?', 'CÂU HỎI TRÙM 12: Thành ngữ "Barking up the wrong tree" có nghĩa là gì?', { A: 'Pursuing a mistaken line of thought', B: 'Climbing a dangerous tree', C: 'Training a hunting dog', D: 'Cutting down the wrong timber' }, 'A', 'Thành ngữ bắt nguồn từ chó săn sủa nhầm gốc cây nơi con mồi đã tẩu thoát, nghĩa là đoán sai hướng.', 18],
  ['boss-013', 'ocean', 'CLASS CO-OP BOSS 13: How many hearts does an octopus have?', 'CÂU HỎI TRÙM 13: Một chú bạch tuộc có tổng cộng bao nhiêu trái tim?', { A: 'Three', B: 'One', C: 'Two', D: 'Four' }, 'A', 'Bạch tuộc có 3 trái tim: 2 tim bơm máu qua mang và 1 tim bơm máu đi khắp cơ thể!', 18],
  ['boss-014', 'science', 'CLASS CO-OP BOSS 14: What is the only metal that is liquid at normal room temperature?', 'CÂU HỎI TRÙM 14: Kim loại duy nhất ở thể lỏng ở nhiệt độ phòng là kim loại nào?', { A: 'Mercury', B: 'Gallium', C: 'Lead', D: 'Zinc' }, 'A', 'Thủy ngân (Mercury - Hg) là kim loại ở thể lỏng ở điều kiện nhiệt độ phòng tiêu chuẩn.', 18],
  ['boss-015', 'history', 'CLASS CO-OP BOSS 15: Who was the first person to step on the Moon in July 1969?', 'CÂU HỎI TRÙM 15: Ai là phi hành gia đầu tiên đặt chân lên Mặt Trăng vào tháng 7 năm 1969?', { A: 'Neil Armstrong', B: 'Buzz Aldrin', C: 'Yuri Gagarin', D: 'Michael Collins' }, 'A', 'Neil Armstrong với câu nói huyền thoại: "Một bước đi nhỏ của con người, một bước tiến lớn của nhân loại".', 18],
  ['boss-016', 'nature', 'CLASS CO-OP BOSS 16: What is a group of flamingos called?', 'CÂU HỎI TRÙM 16: Một đàn chim hồng hạc rực rỡ gọi là gì trong tiếng Anh?', { A: 'A flamboyance', B: 'A parliament', C: 'A murder', D: 'A school' }, 'A', '"A flamboyance of flamingos" chỉ vẻ đẹp rực rỡ lộng lẫy của bầy chim hồng hạc.', 18],
  ['boss-017', 'technology', 'CLASS CO-OP BOSS 17: What does "Wi-Fi" officially stand for according to its creators?', 'CÂU HỎI TRÙM 17: Tên gọi "Wi-Fi" viết tắt của cụm từ gì theo liên minh sáng lập?', { A: 'It is a catchy trademark, not an acronym', B: 'Wireless Fidelity', C: 'Wide Fiber Interconnect', D: 'Worldwide Frequency Interface' }, 'A', 'Wi-Fi là tên thương hiệu đặt ra cho dễ nhớ và vần điệu, không phải từ viết tắt chính thức!', 18],
  ['boss-018', 'space', 'CLASS CO-OP BOSS 18: What is Olympus Mons on Mars famous for?', 'CÂU HỎI TRÙM 18: Ngọn núi Olympus Mons trên Sao Hỏa nổi tiếng về điều gì?', { A: 'The tallest volcano in the solar system', B: 'The deepest crater', C: 'An ocean of ice', D: 'A pyramid structure' }, 'A', 'Olympus Mons cao gần 22 km, cao gấp gần 3 lần đỉnh Everest của Trái Đất!', 18],
  ['boss-019', 'language', 'CLASS CO-OP BOSS 19: Which word is an anagram of "LISTEN"?', 'CÂU HỎI TRÙM 19: Từ nào là phép đảo chữ (anagram) hoàn hảo của từ "LISTEN"?', { A: 'SILENT', B: 'TINSEL', C: 'ENLIST', D: 'All of the above' }, 'D', 'Cả SILENT, TINSEL và ENLIST đều dùng chính xác các chữ cái l-i-s-t-e-n!', 18],
  ['boss-020', 'nature', 'CLASS CO-OP BOSS 20: How many bones do sharks have in their bodies?', 'CÂU HỎI TRÙM 20: Loài cá mập có bao nhiêu chiếc xương cứng trong cơ thể?', { A: 'Zero (all cartilage)', B: 'About 200', C: 'About 50', D: 'Over 1,000' }, 'A', 'Cá mập là loài cá sụn, bộ xương của chúng cấu tạo hoàn toàn bằng chất sụn mềm dẻo!', 18],
  ['boss-021', 'history', 'CLASS CO-OP BOSS 21: Which French monument was originally intended to be dismantled after 20 years?', 'CÂU HỎI TRÙM 21: Công trình biểu tượng nào ở Paris từng dự kiến tháo dỡ sau 20 năm?', { A: 'Eiffel Tower', B: 'Arc de Triomphe', C: 'Louvre Pyramid', D: 'Notre Dame' }, 'A', 'Tháp Eiffel xây cho Hội chợ Thế giới 1889 và suýt bị tháo dỡ, nhưng được giữ lại làm trạm phát sóng vô tuyến.', 18],
  ['boss-022', 'geography', 'CLASS CO-OP BOSS 22: What is the capital city of Australia?', 'CÂU HỎI TRÙM 22: Thủ đô chính thức của nước Úc là thành phố nào?', { A: 'Canberra', B: 'Sydney', C: 'Melbourne', D: 'Brisbane' }, 'A', 'Canberra được chọn làm thủ đô năm 1908 như một giải pháp thỏa hiệp giữa Sydney và Melbourne!', 18],
  ['boss-023', 'trivia', 'CLASS CO-OP BOSS 23: Bananas are botanically classified as which of the following?', 'CÂU HỎI TRÙM 23: Về mặt thực vật học, quả chuối được xếp vào phân loại nào?', { A: 'A berry', B: 'A citrus fruit', C: 'A root vegetable', D: 'A nut' }, 'A', 'Về mặt sinh học, quả chuối là một loại quả mọng (berry) mọc từ hoa có một bầu nhụy!', 18],
  ['boss-024', 'music', 'CLASS CO-OP BOSS 24: How many keys are there on a standard modern acoustic piano?', 'CÂU HỎI TRÙM 24: Có bao nhiêu phím đàn trên một cây đàn piano tiêu chuẩn hiện đại?', { A: '88 keys (52 white, 36 black)', B: '76 keys', C: '92 keys', D: '100 keys' }, 'A', 'Đàn piano tiêu chuẩn có 88 phím: 52 phím trắng và 36 phím đen tương ứng với 7 quãng tám.', 18],
  ['boss-025', 'language', 'CLASS CO-OP BOSS 25: CONGRATULATIONS CLASS! What sentence contains every single letter of the English alphabet?', 'CÂU HỎI TRÙM CUỐI: Câu văn kinh điển nào chứa đủ tất cả 26 chữ cái tiếng Anh?', { A: 'The quick brown fox jumps over the lazy dog', B: 'Pack my box with five dozen liquor jugs', C: 'Sphinx of black quartz, judge my vow', D: 'All of the above (Pangrams)' }, 'D', 'Cả 3 câu trên đều là những câu Pangram trứ danh chứa trọn vẹn 26 chữ cái A-Z!', 20],
];

bossData.forEach(([id, topic, prompt, promptVi, choices, correct, explanation, durationSec]) => {
  addQ(id, topic, 'boss', 4, prompt, promptVi, choices, correct, explanation, durationSec);
});

// -------------------------------------------------------------
// 7. CHALLENGE HOUR QUESTIONS (60 questions across 6 topics)
// -------------------------------------------------------------
const challengeTopics = [
  // Animals (10)
  ['chal-anim-01', 'animals', 'challenge', 1, 'What is the largest land animal?', 'Động vật trên cạn lớn nhất là loài nào?', { A: 'African elephant', B: 'Rhinoceros', C: 'Hippopotamus', D: 'Polar bear' }, 'A', 'Voi châu Phi là loài thú trên cạn to lớn nhất.'],
  ['chal-anim-02', 'animals', 'challenge', 1, 'Which animal is known for changing its skin color to camouflage?', 'Loài bò sát nào đổi màu da để ngụy trang?', { A: 'Chameleon', B: 'Gecko', C: 'Iguana', D: 'Salamander' }, 'A', 'Tắc kè hoa (Chameleon) nổi tiếng với khả năng đổi màu.'],
  ['chal-anim-03', 'animals', 'challenge', 2, 'What bird lays the largest eggs in the world?', 'Loài chim nào đẻ quả trứng to nhất thế giới?', { A: 'Ostrich', B: 'Emu', C: 'Eagle', D: 'Albatross' }, 'A', 'Đà điểu châu Phi (Ostrich) đẻ những quả trứng khổng lồ nặng tới 1.5 kg.'],
  ['chal-anim-04', 'animals', 'challenge', 2, 'What do giant pandas eat almost exclusively?', 'Thức ăn gần như duy nhất của gấu trúc là gì?', { A: 'Bamboo', B: 'Fish', C: 'Berries', D: 'Grass' }, 'A', '99% khẩu phần ăn của gấu trúc là cây trúc/tre xanh.'],
  ['chal-anim-05', 'animals', 'challenge', 1, 'Which flying insect produces silk for luxury fabrics?', 'Loài sâu bướm nào nhả tơ làm lụa quý giá?', { A: 'Silkworm', B: 'Caterpillar', C: 'Dragonfly', D: 'Moth' }, 'A', 'Tằm (Silkworm) nhả tơ dệt nên những tấm lụa mềm mại.'],
  ['chal-anim-06', 'animals', 'challenge', 2, 'What do you call an animal that eats both plants and meat?', 'Động vật ăn cả thực vật và thịt gọi là gì?', { A: 'Omnivore', B: 'Herbivore', C: 'Carnivore', D: 'Insectivore' }, 'A', 'Omnivore là động vật ăn tạp (như con người, gấu).'],
  ['chal-anim-07', 'animals', 'challenge', 2, 'Which sea mammal is famous for its intelligence and clicking sounds?', 'Loài thú biển thông minh giao tiếp bằng tiếng click?', { A: 'Dolphin', B: 'Walrus', C: 'Seal', D: 'Manatee' }, 'A', 'Cá heo (Dolphin) cực kỳ thông minh và thân thiện.'],
  ['chal-anim-08', 'animals', 'challenge', 2, 'What animal can survive for weeks in the desert without water?', 'Con vật có bướu trên lưng vượt sa mạc nhiều tuần không uống nước?', { A: 'Camel', B: 'Llama', C: 'Donkey', D: 'Ostrich' }, 'A', 'Lạc đà (Camel) là "con tàu của sa mạc".'],
  ['chal-anim-09', 'animals', 'challenge', 3, 'What is the fastest bird in a diving hunt?', 'Loài chim săn mồi lao xuống nhanh nhất thế giới?', { A: 'Peregrine falcon', B: 'Golden eagle', C: 'Osprey', D: 'Falcon' }, 'A', 'Cắt lớn (Peregrine falcon) có thể bổ nhào với tốc độ hơn 320 km/h.'],
  ['chal-anim-10', 'animals', 'challenge', 2, 'What marsupial sleeps up to 20 hours a day in eucalyptus trees?', 'Loài thú có túi ngủ 20 tiếng mỗi ngày trên cây bạch đàn?', { A: 'Koala', B: 'Sloth', C: 'Wombat', D: 'Possum' }, 'A', 'Koala ngủ li bì trên cây bạch đàn nước Úc.'],

  // Food & Cooking (10)
  ['chal-food-01', 'food', 'challenge', 1, 'What is the main ingredient of traditional Japanese sushi?', 'Thành phần cốt lõi của món sushi Nhật Bản là gì?', { A: 'Vinegared rice', B: 'Noodles', C: 'Bread', D: 'Potato' }, 'A', 'Sushi nghĩa là món cơm trộn giấm ăn kèm hải sản tươi.'],
  ['chal-food-02', 'food', 'challenge', 1, 'What ingredient makes bread rise and become fluffy?', 'Chất nào giúp bột bánh mì nở phồng xốp?', { A: 'Yeast', B: 'Sugar', C: 'Salt', D: 'Butter' }, 'A', 'Yeast (Men nở) lên men sinh bọt khí làm bánh phồng xốp.'],
  ['chal-food-03', 'food', 'challenge', 2, 'From which plant is chocolate made?', 'Sô-cô-la được làm từ hạt của loài cây nào?', { A: 'Cacao tree', B: 'Coffee bush', C: 'Vanilla orchid', D: 'Nutmeg' }, 'A', 'Hạt ca-cao (Cacao beans) lên men và rang thơm để làm sô-cô-la.'],
  ['chal-food-04', 'food', 'challenge', 2, 'What is the national noodle soup dish of Vietnam?', 'Món súp phở truyền thống danh tiếng của Việt Nam là gì?', { A: 'Pho', B: 'Ramen', C: 'Pasta', D: 'Udon' }, 'A', 'Phở là tinh hoa ẩm thực thơm ngon nức tiếng của Việt Nam.'],
  ['chal-food-05', 'food', 'challenge', 1, 'Which spice gives yellow curry its vibrant color and health benefits?', 'Gia vị tạo nên màu vàng rực rỡ của cà ri là gì?', { A: 'Turmeric', B: 'Pepper', C: 'Cinnamon', D: 'Ginger' }, 'A', 'Củ nghệ (Turmeric) mang sắc vàng và hoạt chất curcumin quý giá.'],
  ['chal-food-06', 'food', 'challenge', 2, 'What French bread is long, slender, and has a crispy crust?', 'Loại bánh mì dài vỏ giòn rụm của nước Pháp tên là gì?', { A: 'Baguette', B: 'Croissant', C: 'Brioche', D: 'Muffin' }, 'A', 'Baguette là ổ bánh mì que giòn đặc trưng nước Pháp.'],
  ['chal-food-07', 'food', 'challenge', 2, 'Which Italian cheese is traditionally sprinkled over spaghetti bolognese?', 'Loại phô mai Ý bột mịn thường rắc lên mì Ý là gì?', { A: 'Parmesan', B: 'Cheddar', C: 'Brie', D: 'Feta' }, 'A', 'Parmesan (Parmigiano-Reggiano) thơm ngậy đậm đà.'],
  ['chal-food-08', 'food', 'challenge', 1, 'What liquid is produced by pressing fresh olives?', 'Dầu ăn vàng óng ép từ quả ô-liu tươi gọi là gì?', { A: 'Olive oil', B: 'Soy sauce', C: 'Vinegar', D: 'Syrup' }, 'A', 'Dầu ô-liu (Olive oil) rất tốt cho tim mạch.'],
  ['chal-food-09', 'food', 'challenge', 2, 'What is tofu made from?', 'Đậu phụ (đậu hũ) thanh mát được làm từ nguyên liệu gì?', { A: 'Soybeans', B: 'Peanuts', C: 'Rice flour', D: 'Cornstarch' }, 'A', 'Đậu phụ làm từ hạt đậu nành (Soybeans) giàu đạm thực vật.'],
  ['chal-food-10', 'food', 'challenge', 3, 'Which is the most expensive spice in the world by weight?', 'Gia vị đắt nhất thế giới thu hoạch từ nhụy hoa huệ tây?', { A: 'Saffron', B: 'Vanilla', C: 'Cardamom', D: 'Cloves' }, 'A', 'Saffron (Nhụy hoa nghệ tây) thu hoạch thủ công quý như vàng.'],

  // Daily Life & Jobs (10)
  ['chal-job-01', 'jobs', 'challenge', 1, 'Who designs buildings, houses, and bridges?', 'Ai là người vẽ thiết kế nhà cửa và công trình kiến trúc?', { A: 'Architect', B: 'Plumber', C: 'Mechanic', D: 'Electrician' }, 'A', 'Architect là kiến trúc sư tài ba.'],
  ['chal-job-02', 'jobs', 'challenge', 1, 'Who extinguishes fires and rescues people from burning buildings?', 'Ai dũng cảm chữa cháy và cứu người khỏi hỏa hoạn?', { A: 'Firefighter', B: 'Police officer', C: 'Lifeguard', D: 'Soldier' }, 'A', 'Firefighter là lính cứu hỏa kiên cường.'],
  ['chal-job-03', 'jobs', 'challenge', 2, 'Who prepares and cooks gourmet dishes in restaurants?', 'Ai nấu những món ăn ngon tuyệt trong nhà hàng?', { A: 'Chef', B: 'Waiter', C: 'Cashier', D: 'Bartender' }, 'A', 'Chef là bếp trưởng nấu nướng chuyên nghiệp.'],
  ['chal-job-04', 'jobs', 'challenge', 1, 'Who checks and takes care of your teeth?', 'Ai khám và chăm sóc hàm răng khỏe đẹp cho bạn?', { A: 'Dentist', B: 'Surgeon', C: 'Pharmacist', D: 'Optician' }, 'A', 'Dentist là nha sĩ chăm sóc răng miệng.'],
  ['chal-job-05', 'jobs', 'challenge', 2, 'Who writes articles and reports news for newspapers and TV?', 'Ai viết bài và đưa tin tức trên báo đài?', { A: 'Journalist', B: 'Novelist', C: 'Poet', D: 'Publisher' }, 'A', 'Journalist là nhà báo, phóng viên tin tức.'],
  ['chal-job-06', 'jobs', 'challenge', 2, 'Who represents clients in a court of law?', 'Ai bào chữa và đại diện pháp lý cho thân chủ tại tòa án?', { A: 'Lawyer', B: 'Judge', C: 'Clerk', D: 'Detective' }, 'A', 'Lawyer là luật sư bảo vệ công lý.'],
  ['chal-job-07', 'jobs', 'challenge', 1, 'Who fixes leaking water pipes and faucets?', 'Ai sửa chữa đường ống nước và vòi nước bị rò rỉ?', { A: 'Plumber', B: 'Carpenter', C: 'Mason', D: 'Painter' }, 'A', 'Plumber là thợ sửa ống nước lành nghề.'],
  ['chal-job-08', 'jobs', 'challenge', 2, 'Who operates the camera and directs actors in a movie?', 'Ai chỉ đạo diễn xuất và chỉ đạo sản xuất một bộ phim?', { A: 'Film director', B: 'Costume designer', C: 'Stuntman', D: 'Audience' }, 'A', 'Film director là đạo diễn điện ảnh.'],
  ['chal-job-09', 'jobs', 'challenge', 2, 'Who works in a pharmacy preparing prescription medicine?', 'Ai làm việc tại hiệu thuốc và cấp phát thuốc theo đơn?', { A: 'Pharmacist', B: 'Biologist', C: 'Nurse', D: 'Therapist' }, 'A', 'Pharmacist là dược sĩ chuyên nghiệp.'],
  ['chal-job-10', 'jobs', 'challenge', 2, 'Who explores deep outer space in a rocket?', 'Ai bay vào vũ trụ bao la trên tàu vũ trụ?', { A: 'Astronaut', B: 'Astronomer', C: 'Geologist', D: 'Meteorologist' }, 'A', 'Astronaut là phi hành gia bay vào không gian.'],

  // Travel & Geography (10)
  ['chal-trav-01', 'travel', 'challenge', 1, 'What document do you need to travel internationally between countries?', 'Cuốn sổ thông hành cần thiết khi bay ra nước ngoài?', { A: 'Passport', B: 'Receipt', C: 'Library card', D: 'Diploma' }, 'A', 'Passport (Hộ chiếu) là giấy tờ tùy thân quốc tế.'],
  ['chal-trav-02', 'travel', 'challenge', 1, 'What building do you go to when boarding an airplane flight?', 'Nơi bạn đến để làm thủ tục lên máy bay cất cánh?', { A: 'Airport', B: 'Harbor', C: 'Bus terminal', D: 'Subway station' }, 'A', 'Airport là sân bay hàng không.'],
  ['chal-trav-03', 'travel', 'challenge', 2, 'Which mountain is the highest above sea level on Earth?', 'Đỉnh núi cao nhất thế giới trên mực nước biển?', { A: 'Mount Everest', B: 'K2', C: 'Kangchenjunga', D: 'Mont Blanc' }, 'A', 'Đỉnh Everest cao 8.848m trên dãy Himalaya.'],
  ['chal-trav-04', 'travel', 'challenge', 2, 'Which is the longest river in the world?', 'Dòng sông dài nhất hành tinh chảy qua châu Phi?', { A: 'Nile River', B: 'Amazon River', C: 'Yangtze River', D: 'Mississippi River' }, 'A', 'Sông Nile ở châu Phi dài hơn 6.650 km.'],
  ['chal-trav-05', 'travel', 'challenge', 1, 'What is the currency of Japan?', 'Đơn vị tiền tệ chính thức của đất nước Nhật Bản là gì?', { A: 'Yen', B: 'Won', C: 'Dollar', D: 'Euro' }, 'A', 'Yen (JPY - Yên Nhật) là tiền tệ Nhật Bản.'],
  ['chal-trav-06', 'travel', 'challenge', 2, 'What famous giant clock tower stands next to the British Parliament in London?', 'Tháp đồng hồ khổng lồ nổi tiếng bên bờ sông Thames ở Luân Đôn?', { A: 'Big Ben', B: 'Eiffel Tower', C: 'Leaning Tower', D: 'Empire State' }, 'A', 'Big Ben (Tháp Elizabeth) là biểu tượng nước Anh.'],
  ['chal-trav-07', 'travel', 'challenge', 1, 'Which is the largest hot desert on Earth?', 'Sa mạc cát nóng lớn nhất thế giới ở Bắc Phi?', { A: 'Sahara Desert', B: 'Gobi Desert', C: 'Kalahari Desert', D: 'Atacama Desert' }, 'A', 'Sa mạc Sahara bao la trải dài khắp Bắc Phi.'],
  ['chal-trav-08', 'travel', 'challenge', 2, 'What famous statue welcomes travelers into New York Harbor?', 'Bức tượng đồng giơ cao ngọn đuốc chào đón người đến New York?', { A: 'Statue of Liberty', B: 'Christ the Redeemer', C: 'The Thinker', D: 'David' }, 'A', 'Statue of Liberty (Tượng Nữ thần Tự do) ở New York.'],
  ['chal-trav-09', 'travel', 'challenge', 2, 'What ancient wonder in China stretches for thousands of kilometers?', 'Công trình tường thành cổ đại vĩ đại kéo dài vạn dặm ở Trung Quốc?', { A: 'Great Wall of China', B: 'Terracotta Army', C: 'Forbidden City', D: 'Potala Palace' }, 'A', 'Vạn Lý Trường Thành (Great Wall of China) sừng sững qua ngàn năm.'],
  ['chal-trav-10', 'travel', 'challenge', 2, 'What is the capital city of France?', 'Kinh đô ánh sáng, thủ đô của nước Pháp là gì?', { A: 'Paris', B: 'Lyon', C: 'Marseille', D: 'Bordeaux' }, 'A', 'Paris là thủ đô lãng mạn của nước Pháp.'],

  // Technology & Inventions (10)
  ['chal-tech-01', 'tech', 'challenge', 1, 'What brain of the computer processes all instructions?', 'Bộ não trung tâm xử lý dữ liệu của máy tính gọi là gì?', { A: 'CPU', B: 'RAM', C: 'Hard drive', D: 'Monitor' }, 'A', 'CPU (Central Processing Unit) là bộ vi xử lý trung tâm.'],
  ['chal-tech-02', 'tech', 'challenge', 2, 'Who invented the modern incandescent light bulb?', 'Nhà phát minh nào cải tiến bóng đèn sợi đốt thắp sáng thế giới?', { A: 'Thomas Edison', B: 'Alexander Bell', C: 'Nikola Tesla', D: 'Isaac Newton' }, 'A', 'Thomas Edison đã hoàn thiện bóng đèn điện thương mại năm 1879.'],
  ['chal-tech-03', 'tech', 'challenge', 1, 'What does "WWW" stand for in a website address?', 'Chữ viết tắt "WWW" trong địa chỉ trang web nghĩa là gì?', { A: 'World Wide Web', B: 'World Wide Wire', C: 'Web World Wide', D: 'Wireless World Web' }, 'A', 'World Wide Web do Tim Berners-Lee sáng lập năm 1989.'],
  ['chal-tech-04', 'tech', 'challenge', 2, 'What wireless technology connects headphones to your phone over short distances?', 'Công nghệ không dây tầm gần kết nối tai nghe và điện thoại?', { A: 'Bluetooth', B: 'Satellite', C: 'Fiber optic', D: 'Infrared' }, 'A', 'Bluetooth là chuẩn kết nối không dây tầm gần tiện ích.'],
  ['chal-tech-05', 'tech', 'challenge', 2, 'Who invented the first practical telephone?', 'Nhà phát minh nào nhận bằng sáng chế chiếc điện thoại đầu tiên?', { A: 'Alexander Graham Bell', B: 'Albert Einstein', C: 'Guglielmo Marconi', D: 'Steve Jobs' }, 'A', 'Alexander Graham Bell phát minh ra điện thoại năm 1876.'],
  ['chal-tech-06', 'tech', 'challenge', 1, 'What battery-powered portable computer folds like a book?', 'Máy vi tính xách tay gấp gọn như cuốn sổ gọi là gì?', { A: 'Laptop', B: 'Desktop', C: 'Server', D: 'Mainframe' }, 'A', 'Laptop (máy tính xách tay) linh hoạt mang theo mọi nơi.'],
  ['chal-tech-07', 'tech', 'challenge', 2, 'What does "AI" stand for in modern technology?', 'Thuật ngữ "AI" trong công nghệ hiện đại viết tắt của từ gì?', { A: 'Artificial Intelligence', B: 'Automated Internet', C: 'Advanced Interface', D: 'Applied Innovation' }, 'A', 'Artificial Intelligence (Trí tuệ nhân tạo) đang thay đổi thế giới.'],
  ['chal-tech-08', 'tech', 'challenge', 2, 'What renewable energy source captures power from sunshine?', 'Nguồn năng lượng sạch hấp thu từ ánh nắng Mặt Trời?', { A: 'Solar energy', B: 'Coal power', C: 'Diesel fuel', D: 'Natural gas' }, 'A', 'Solar energy (Năng lượng mặt trời) sạch và dồi dào.'],
  ['chal-tech-09', 'tech', 'challenge', 1, 'What hand-held device moves the cursor on your computer screen?', 'Thiết bị cầm tay lăn chuột điều khiển con trỏ trên màn hình?', { A: 'Mouse', B: 'Keyboard', C: 'Speaker', D: 'Webcam' }, 'A', 'Chuột máy tính (Mouse) giúp điều hướng màn hình.'],
  ['chal-tech-10', 'tech', 'challenge', 3, 'In computer science, what are the two digits used in binary code?', 'Hệ nhị phân trong khoa học máy tính chỉ sử dụng 2 chữ số nào?', { A: '0 and 1', B: '1 and 2', C: '0 and 9', D: 'A and B' }, 'A', 'Mã nhị phân (Binary) chỉ gồm 2 con số 0 và 1 cơ bản.'],

  // Idioms & Expressions (10)
  ['chal-id-01', 'idioms', 'challenge', 2, 'What does "A piece of cake" mean?', 'Thành ngữ "A piece of cake" có nghĩa là gì?', { A: 'Very easy and effortless', B: 'A slice of sweet dessert', C: 'A difficult dilemma', D: 'A surprise gift' }, 'A', 'A piece of cake nghĩa là việc gì đó dễ như ăn bánh.'],
  ['chal-id-02', 'idioms', 'challenge', 2, 'What does "Break a leg" mean to a performer before a show?', 'Lời chúc "Break a leg" trước buổi biểu diễn mang nghĩa gì?', { A: 'Good luck!', B: 'Be careful!', C: 'Fall down!', D: 'Stop singing!' }, 'A', 'Break a leg là lời chúc may mắn và thành công của giới sân khấu.'],
  ['chal-id-03', 'idioms', 'challenge', 2, 'What does "Cost an arm and a leg" mean?', 'Thành ngữ "Cost an arm and a leg" ám chỉ điều gì?', { A: 'Extremely expensive', B: 'Very painful', C: 'Free of charge', D: 'A bargain' }, 'A', 'Ý chỉ một thứ gì đó cực kỳ đắt đỏ, tốn kém.'],
  ['chal-id-04', 'idioms', 'challenge', 2, 'What does "Once in a blue moon" mean?', 'Thành ngữ "Once in a blue moon" chỉ điều gì?', { A: 'Very rarely happening', B: 'Every single week', C: 'During night time', D: 'Never at all' }, 'A', 'Once in a blue moon chỉ một sự kiện hiếm khi xảy ra.'],
  ['chal-id-05', 'idioms', 'challenge', 2, 'What does "Spill the beans" mean?', 'Thành ngữ "Spill the beans" có nghĩa là gì?', { A: 'Reveal a secret accidentally', B: 'Drop grocery food', C: 'Cook vegetable soup', D: 'Make a mess' }, 'A', 'Spill the beans nghĩa là vô tình để lộ bí mật.'],
  ['chal-id-06', 'idioms', 'challenge', 2, 'What does "Burn the midnight oil" mean?', 'Thành ngữ "Burn the midnight oil" miêu tả hành động gì?', { A: 'Study or work late into the night', B: 'Set fire to kerosene', C: 'Sleep deeply', D: 'Cook late dinner' }, 'A', 'Thức khuya miệt mài học bài hoặc làm việc.'],
  ['chal-id-07', 'idioms', 'challenge', 2, 'What does "Under the weather" mean when someone feels it?', 'Khi ai đó nói "I feel under the weather", họ đang bị sao?', { A: 'Feeling slightly sick or unwell', B: 'Standing in the rain', C: 'Sunburnt', D: 'Very energetic' }, 'A', 'Under the weather nghĩa là cảm thấy mệt mỏi, khó ở, ốm nhẹ.'],
  ['chal-id-08', 'idioms', 'challenge', 2, 'What does "Hit the books" mean to a diligent student?', 'Thành ngữ "Hit the books" của học sinh chăm chỉ có nghĩa là gì?', { A: 'Begin studying hard', B: 'Punch the notebook', C: 'Throw books away', D: 'Buy new textbooks' }, 'A', 'Hit the books là bắt tay vào học tập chăm chỉ.'],
  ['chal-id-09', 'idioms', 'challenge', 2, 'What does "See eye to eye" mean between two friends?', 'Cụm từ "See eye to eye" giữa hai người bạn có nghĩa là gì?', { A: 'Agree with each other', B: 'Stare angrily', C: 'Wear matching glasses', D: 'Argue loudly' }, 'A', 'See eye to eye nghĩa là đồng tình, có cùng quan điểm với nhau.'],
  ['chal-id-10', 'idioms', 'challenge', 2, 'What does "Every cloud has a silver lining" mean?', 'Câu danh ngôn "Every cloud has a silver lining" khuyên chúng ta điều gì?', { A: 'There is hope in every difficult situation', B: 'Silver falls from clouds', C: 'Storms are dangerous', D: 'Rain makes flowers grow' }, 'A', 'Trong cái rủi luôn có cái may, trong khó khăn luôn le lói hy vọng.'],
];

challengeTopics.forEach(([id, topic, mode, difficulty, prompt, promptVi, choices, correct, explanation]) => {
  addQ(id, topic, mode, difficulty, prompt, promptVi, choices, correct, explanation, 14);
});

// -------------------------------------------------------------
// 8. QUICK QUIZ VOCABULARY & GRAMMAR EXTENSION (60 questions)
// -------------------------------------------------------------
const quickData = [
  ['q-ext-001', 'grammar', 'Complete: She ___ to school by bicycle every morning.', 'Chọn động từ chia thì hiện tại đơn ngôi thứ ba số ít:', { A: 'goes', B: 'go', C: 'going', D: 'gone' }, 'A', 'Chủ ngữ "She" số ít ở hiện tại đơn thêm -es thành "goes".'],
  ['q-ext-002', 'grammar', 'Complete: I have lived in this city ___ five years.', 'Chọn giới từ đi với khoảng thời gian: ...five years.', { A: 'for', B: 'since', C: 'in', D: 'at' }, 'A', 'Dùng "for" với khoảng thời gian, "since" với mốc thời gian.'],
  ['q-ext-003', 'grammar', 'Complete: They were studying English when the power ___ out.', 'Quá khứ tiếp diễn kết hợp quá khứ đơn: ...the power ___ out.', { A: 'went', B: 'goes', C: 'gone', D: 'going' }, 'A', 'Hành động xen vào chia thì quá khứ đơn: "went out".'],
  ['q-ext-004', 'vocab', 'What is the opposite of "Polite"?', 'Từ trái nghĩa với "Polite" (Lịch sự) là gì?', { A: 'Rude', B: 'Kind', C: 'Gentle', D: 'Sweet' }, 'A', 'Rude nghĩa là thô lỗ, bất lịch sự.'],
  ['q-ext-005', 'vocab', 'What is the synonym of "Quick"?', 'Từ đồng nghĩa với "Quick" (Nhanh nhẹn) là gì?', { A: 'Fast', B: 'Slow', C: 'Heavy', D: 'Calm' }, 'A', 'Fast và Quick đều có nghĩa là nhanh chóng.'],
  ['q-ext-006', 'grammar', 'Complete: This is the ___ book I have ever read.', 'Dạng so sánh nhất của "interesting": This is the ___ book...', { A: 'most interesting', B: 'more interesting', C: 'interestingest', D: 'as interesting' }, 'A', 'So sánh nhất với tính từ dài dùng "the most + adj".'],
  ['q-ext-007', 'grammar', 'Complete: You ___ wear a helmet when riding a motorbike.', 'Động từ khuyết thiếu chỉ sự bắt buộc: You ___ wear a helmet...', { A: 'must', B: 'might', C: 'would', D: 'could' }, 'A', 'Dùng "must" để chỉ quy định bắt buộc phải đội mũ bảo hiểm.'],
  ['q-ext-008', 'vocab', 'What do we call the daughter of your brother or sister?', 'Con gái của anh chị em ruột bạn gọi là gì trong tiếng Anh?', { A: 'Niece', B: 'Nephew', C: 'Cousin', D: 'Aunt' }, 'A', 'Niece là cháu gái, Nephew là cháu trai.'],
  ['q-ext-009', 'vocab', 'What do we call the son of your brother or sister?', 'Con trai của anh chị em ruột bạn gọi là gì?', { A: 'Nephew', B: 'Niece', C: 'Uncle', D: 'Brother' }, 'A', 'Nephew là cháu trai của cô dì chú bác.'],
  ['q-ext-010', 'grammar', 'Complete: If it rains tomorrow, we ___ stay at home.', 'Câu điều kiện loại 1: If it rains tomorrow, we ___ stay at home.', { A: 'will', B: 'would', C: 'had', D: 'were' }, 'A', 'Mệnh đề chính của câu điều kiện loại 1 dùng "will + V".'],
  ['q-ext-011', 'vocab', 'What is the opposite of "Generous"?', 'Từ trái nghĩa với "Generous" (Rộng lượng) là gì?', { A: 'Stingy', B: 'Kind', C: 'Helpful', D: 'Friendly' }, 'A', 'Stingy (hoặc Mean) nghĩa là keo kiệt, bủn xỉn.'],
  ['q-ext-012', 'grammar', 'Complete: She asked me where I ___ from.', 'Câu tường thuật lùi thì: She asked me where I ___ from.', { A: 'came', B: 'come', C: 'coming', D: 'will come' }, 'A', 'Trong câu gián tiếp, động từ lùi thì về quá khứ đơn "came".'],
  ['q-ext-013', 'vocab', 'What is the room in a house where meals are cooked?', 'Căn phòng trong nhà nơi nấu nướng thức ăn gọi là gì?', { A: 'Kitchen', B: 'Bedroom', C: 'Bathroom', D: 'Living room' }, 'A', 'Kitchen là căn bếp ấm cúng của gia đình.'],
  ['q-ext-014', 'grammar', 'Complete: I look forward to ___ you soon.', 'Cụm từ "look forward to" đi với dạng động từ nào?', { A: 'seeing', B: 'see', C: 'saw', D: 'seen' }, 'A', 'Cấu trúc chuẩn: Look forward to + V-ing (mong đợi điều gì).'],
  ['q-ext-015', 'vocab', 'What is the opposite of "Ancient"?', 'Từ trái nghĩa với "Ancient" (Cổ kính, cổ xưa) là gì?', { A: 'Modern', B: 'Old', C: 'Historic', D: 'Antique' }, 'A', 'Modern là hiện đại, tân thời đối lập với Ancient.'],
  ['q-ext-016', 'grammar', 'Complete: He is capable ___ solving complex math puzzles.', 'Giới từ đi với tính từ "capable": He is capable ___...', { A: 'of', B: 'in', C: 'with', D: 'at' }, 'A', 'Cấu trúc cố định: Capable OF + V-ing (có năng lực làm gì).'],
  ['q-ext-017', 'vocab', 'What instrument measures body temperature when sick?', 'Dụng cụ đo nhiệt độ cơ thể khi bị sốt gọi là gì?', { A: 'Thermometer', B: 'Barometer', C: 'Speedometer', D: 'Altimeter' }, 'A', 'Thermometer là nhiệt kế y tế.'],
  ['q-ext-018', 'grammar', 'Choose the correct plural form of "Child":', 'Dạng số nhiều bất quy tắc của danh từ "Child" (đứa trẻ) là gì?', { A: 'Children', B: 'Childs', C: 'Childrens', D: 'Childes' }, 'A', 'Child -> Children (những đứa trẻ).'],
  ['q-ext-019', 'grammar', 'Choose the correct plural form of "Tooth":', 'Dạng số nhiều bất quy tắc của danh từ "Tooth" (chiếc răng) là gì?', { A: 'Teeth', B: 'Tooths', C: 'Teethes', D: 'Toothen' }, 'A', 'Tooth -> Teeth (hàm răng).'],
  ['q-ext-020', 'grammar', 'Choose the correct plural form of "Mouse":', 'Dạng số nhiều của danh từ "Mouse" (con chuột) là gì?', { A: 'Mice', B: 'Mouses', C: 'Mices', D: 'Mouse' }, 'A', 'Mouse -> Mice (những chú chuột).'],
  ['q-ext-021', 'vocab', 'What is the opposite of "Cautious"?', 'Từ trái nghĩa với "Cautious" (Thận trọng, cẩn thận) là gì?', { A: 'Reckless', B: 'Careful', C: 'Alert', D: 'Wary' }, 'A', 'Reckless nghĩa là liều lĩnh, bất cẩn.'],
  ['q-ext-022', 'grammar', 'Complete: Although it was raining heavily, they ___ to play football.', 'Chọn động từ quá khứ phù hợp: ...they ___ to play football.', { A: 'continued', B: 'continue', C: 'continuing', D: 'have continued' }, 'A', 'Mệnh đề quá khứ phối hợp thì: continued.'],
  ['q-ext-023', 'vocab', 'What is the collective noun for a group of fish?', 'Từ chỉ một đàn cá bơi lội dưới nước là gì?', { A: 'School', B: 'Pack', C: 'Flock', D: 'Herd' }, 'A', 'A school of fish nghĩa là một đàn cá.'],
  ['q-ext-024', 'vocab', 'What is the collective noun for a group of birds?', 'Từ chỉ một đàn chim bay lượn là gì?', { A: 'Flock', B: 'Pack', C: 'Swarm', D: 'Colony' }, 'A', 'A flock of birds nghĩa là một đàn chim.'],
  ['q-ext-025', 'grammar', 'Complete: She sings ___ than anyone else in our choir.', 'So sánh hơn với trạng từ "beautifully": She sings ___ than...', { A: 'more beautifully', B: 'beautifuler', C: 'most beautifully', D: 'as beautifully' }, 'A', 'Trạng từ kết thúc bằng -ly dùng "more + adv".'],
  ['q-ext-026', 'vocab', 'What do we call someone who plays the piano?', 'Người biểu diễn đàn piano gọi là gì?', { A: 'Pianist', B: 'Guitarist', C: 'Violinist', D: 'Drummer' }, 'A', 'Pianist là nghệ sĩ dương cầm.'],
  ['q-ext-027', 'vocab', 'What do we call someone who paints pictures?', 'Người vẽ tranh nghệ thuật gọi là gì?', { A: 'Painter / Artist', B: 'Writer', C: 'Actor', D: 'Singer' }, 'A', 'Painter hoặc Artist là họa sĩ.'],
  ['q-ext-028', 'grammar', 'Complete: By the time we arrived at the cinema, the movie ___ already started.', 'Quá khứ hoàn thành diễn tả hành động xảy ra trước: ...the movie ___ already started.', { A: 'had', B: 'has', C: 'have', D: 'was' }, 'A', 'Hành động xảy ra trước một thời điểm quá khứ dùng Had + V3.'],
  ['q-ext-029', 'vocab', 'What is the opposite of "Cruel"?', 'Từ trái nghĩa với "Cruel" (Độc ác, tàn nhẫn) là gì?', { A: 'Kind / Compassionate', B: 'Evil', C: 'Harsh', D: 'Fierce' }, 'A', 'Kind nghĩa là nhân hậu, tốt bụng.'],
  ['q-ext-030', 'grammar', 'Complete: He apologized ___ breaking my favorite vase.', 'Giới từ đi sau động từ "apologize": He apologized ___ breaking...', { A: 'for', B: 'to', C: 'about', D: 'with' }, 'A', 'Cấu trúc: Apologize for + V-ing (xin lỗi vì việc gì).'],
  ['q-ext-031', 'vocab', 'What is the period of ten years called?', 'Khoảng thời gian 10 năm gọi là gì trong tiếng Anh?', { A: 'Decade', B: 'Century', C: 'Millennium', D: 'Fortnight' }, 'A', 'Decade là thập kỷ (10 năm). Century là thế kỷ (100 năm).'],
  ['q-ext-032', 'vocab', 'What is a period of two weeks called in British English?', 'Khoảng thời gian 2 tuần (14 ngày) trong tiếng Anh gọi là gì?', { A: 'Fortnight', B: 'Weekend', C: 'Semester', D: 'Quarter' }, 'A', 'Fortnight bắt nguồn từ "fourteen nights" (14 đêm/2 tuần).'],
  ['q-ext-033', 'grammar', 'Complete: Neither my father nor my brothers ___ fond of coffee.', 'Hòa hợp theo chủ ngữ gần nhất "my brothers" (số nhiều): ...___ fond of coffee.', { A: 'are', B: 'is', C: 'was', D: 'be' }, 'A', 'Chủ ngữ gần động từ nhất là "my brothers" số nhiều -> are.'],
  ['q-ext-034', 'vocab', 'What do we call a person who travels to space?', 'Người du hành vào không gian vũ trụ là gì?', { A: 'Astronaut', B: 'Astrologer', C: 'Pilot', D: 'Sailor' }, 'A', 'Astronaut là phi hành gia vũ trụ.'],
  ['q-ext-035', 'grammar', 'Complete: I would rather you ___ smoke in this room.', 'Cấu trúc "would rather + S + V2" diễn tả mong muốn ở hiện tại:', { A: 'didn\'t', B: 'don\'t', C: 'not', D: 'won\'t' }, 'A', 'Would rather (that) + S + V quá khứ đơn: didn\'t smoke.'],
  ['q-ext-036', 'vocab', 'What do we call animals that sleep during the day and are active at night?', 'Động vật ngủ ngày cày đêm gọi là gì?', { A: 'Nocturnal', B: 'Diurnal', C: 'Aquatic', D: 'Aerial' }, 'A', 'Nocturnal là động vật ăn đêm (như cú mèo, dơi).'],
  ['q-ext-037', 'grammar', 'Choose the correct question tag: You don\'t like spicy food, ___?', 'Câu hỏi đuôi của câu phủ định hiện tại đơn:', { A: 'do you', B: 'don\'t you', C: 'are you', D: 'will you' }, 'A', 'Mệnh đề chính phủ định "don\'t" -> câu hỏi đuôi khẳng định "do you?".'],
  ['q-ext-038', 'vocab', 'What is the opposite of "Timid"?', 'Từ trái nghĩa với "Timid" (Nhút nhát, e thẹn) là gì?', { A: 'Bold / Brave', B: 'Shy', C: 'Fearful', D: 'Quiet' }, 'A', 'Bold nghĩa là táo bạo, can đảm đối lập với Timid.'],
  ['q-ext-039', 'grammar', 'Complete: The teacher asked the students to stop ___ noise.', 'Sau "stop" mang nghĩa chấm dứt hành động đang diễn ra:', { A: 'making', B: 'to make', C: 'made', D: 'make' }, 'A', 'Stop + V-ing là dừng hẳn việc đang làm.'],
  ['q-ext-040', 'vocab', 'What do we call an animal with a backbone or spinal column?', 'Động vật có xương sống gọi là gì trong sinh học?', { A: 'Vertebrate', B: 'Invertebrate', C: 'Mollusk', D: 'Arthropod' }, 'A', 'Vertebrate là động vật có xương sống.'],
  ['q-ext-041', 'grammar', 'Complete: She is good ___ playing the violin.', 'Giới từ đi với "good" mang nghĩa giỏi môn gì:', { A: 'at', B: 'in', C: 'with', D: 'on' }, 'A', 'Good at + V-ing/N nghĩa là giỏi về lĩnh vực gì.'],
  ['q-ext-042', 'vocab', 'What is the opposite of "Permanent"?', 'Từ trái nghĩa với "Permanent" (Lâu dài, vĩnh viễn) là gì?', { A: 'Temporary', B: 'Eternal', C: 'Constant', D: 'Fixed' }, 'A', 'Temporary nghĩa là tạm thời, nhất thời.'],
  ['q-ext-043', 'grammar', 'Complete: I have never seen such a ___ sunset before.', 'Trật tự tính từ: I have never seen such a ___ sunset before.', { A: 'breathtaking', B: 'breath', C: 'breathed', D: 'breathe' }, 'A', 'Breathtaking (adj) nghĩa là đẹp nghẹt thở, tuyệt mỹ.'],
  ['q-ext-044', 'vocab', 'What do we call the green pigment in plant leaves that absorbs sunlight?', 'Sắc tố màu xanh trong lá cây giúp hấp thu ánh sáng là gì?', { A: 'Chlorophyll', B: 'Melanin', C: 'Carotene', D: 'Hemoglobin' }, 'A', 'Chlorophyll (Diệp lục tố) giúp lá cây quang hợp.'],
  ['q-ext-045', 'grammar', 'Complete: The news ___ very surprising to all of us.', 'Danh từ không đếm được "News" đi với động từ số ít:', { A: 'was', B: 'were', C: 'are', D: 'have been' }, 'A', '"News" là danh từ không đếm được, dùng động từ số ít "was".'],
  ['q-ext-046', 'vocab', 'What is the synonym of "Courteous"?', 'Từ đồng nghĩa với "Courteous" (Lịch thiệp) là gì?', { A: 'Polite', B: 'Rude', C: 'Clumsy', D: 'Harsh' }, 'A', 'Courteous và Polite đều có nghĩa là lịch sự, nhã nhặn.'],
  ['q-ext-047', 'grammar', 'Complete: Despite ___ tired, she finished all her homework.', 'Sau giới từ "Despite" dùng danh từ hoặc V-ing:', { A: 'being', B: 'she was', C: 'to be', D: 'was' }, 'A', 'Despite + V-ing: Despite being tired (Mặc dù mệt mỏi).'],
  ['q-ext-048', 'vocab', 'What is the opposite of "Expand"?', 'Từ trái nghĩa với "Expand" (Mở rộng, giãn ra) là gì?', { A: 'Contract', B: 'Grow', C: 'Enlarge', D: 'Spread' }, 'A', 'Contract là co lại, thu hẹp lại.'],
  ['q-ext-049', 'grammar', 'Complete: He insisted ___ paying for our lunch.', 'Giới từ đi sau động từ "insist": He insisted ___ paying...', { A: 'on', B: 'in', C: 'at', D: 'for' }, 'A', 'Cấu trúc chuẩn: Insist on + V-ing (khăng khăng đòi làm gì).'],
  ['q-ext-050', 'vocab', 'What is the study of celestial bodies and the universe called?', 'Ngành khoa học nghiên cứu về các thiên thể và vũ trụ là gì?', { A: 'Astronomy', B: 'Astrology', C: 'Geology', D: 'Ecology' }, 'A', 'Astronomy là ngành Thiên văn học.'],
  ['q-ext-051', 'grammar', 'Choose the correct sentence:', 'Chọn câu có trật tự từ đúng:', { A: 'She bought a lovely small wooden clock.', B: 'She bought a wooden small lovely clock.', C: 'She bought a small lovely wooden clock.', D: 'She bought a wooden lovely small clock.' }, 'A', 'Quy tắc OSASCOMP: Opinion (lovely) -> Size (small) -> Material (wooden).'],
  ['q-ext-052', 'vocab', 'What is the antonym of "Complex"?', 'Từ trái nghĩa với "Complex" (Phức tạp) là gì?', { A: 'Simple', B: 'Complicated', C: 'Difficult', D: 'Intricate' }, 'A', 'Simple nghĩa là đơn giản, dễ hiểu.'],
  ['q-ext-053', 'grammar', 'Complete: It was such a difficult test that few students ___ passing it.', 'Mệnh đề kết quả "such... that": ...few students ___ passing it.', { A: 'succeeded in', B: 'managed to', C: 'failed in', D: 'tried at' }, 'A', 'Cấu trúc: Succeed in + V-ing (thành công trong việc gì).'],
  ['q-ext-054', 'vocab', 'What is the name of a person who creates dances and stage movements?', 'Người biên đạo các điệu nhảy và bài múa là gì?', { A: 'Choreographer', B: 'Director', C: 'Composer', D: 'Sculptor' }, 'A', 'Choreographer là biên đạo múa.'],
  ['q-ext-055', 'grammar', 'Complete: The bridge ___ built two centuries ago is still strong.', 'Rút gọn mệnh đề quan hệ dạng bị động: The bridge (which was) built...', { A: 'built', B: 'building', C: 'was built', D: 'is built' }, 'A', 'Rút gọn mệnh đề quan hệ thể bị động bằng quá khứ phân từ V3: built.'],
  ['q-ext-056', 'vocab', 'What does "Diligent" mean?', 'Từ vựng "Diligent" miêu tả đức tính gì?', { A: 'Hardworking and careful', B: 'Lazy and careless', C: 'Selfish', D: 'Impatient' }, 'A', 'Diligent nghĩa là siêng năng, cần cù, chăm chỉ.'],
  ['q-ext-057', 'grammar', 'Complete: We won\'t start the meeting until everyone ___ arrived.', 'Mệnh đề trạng ngữ chỉ thời gian ở hiện tại hoàn thành: ...until everyone ___ arrived.', { A: 'has', B: 'have', C: 'had', D: 'will have' }, 'A', 'Đại từ bất định "Everyone" đi với động từ số ít "has".'],
  ['q-ext-058', 'vocab', 'What is the synonym of "Abundant"?', 'Từ đồng nghĩa với "Abundant" (Dồi dào) là gì?', { A: 'Plentiful', B: 'Scarce', C: 'Sparse', D: 'Empty' }, 'A', 'Plentiful và Abundant đều mang nghĩa phong phú, dồi dào.'],
  ['q-ext-059', 'grammar', 'Complete: If I ___ you, I would accept the scholarship immediately.', 'Câu điều kiện loại 2 giả định lời khuyên: If I ___ you...', { A: 'were', B: 'am', C: 'was', D: 'have been' }, 'A', 'Câu điều kiện loại 2 dùng "were" cho tất cả các ngôi.'],
  ['q-ext-060', 'vocab', 'What do we call a person who translates speech orally in real-time?', 'Người phiên dịch miệng trực tiếp giữa hai ngôn ngữ gọi là gì?', { A: 'Interpreter', B: 'Translator', C: 'Writer', D: 'Editor' }, 'A', 'Interpreter là thông dịch viên (dịch miệng), Translator là biên dịch viên (dịch văn bản).'],
];

quickData.forEach(([id, topic, prompt, promptVi, choices, correct, explanation]) => {
  addQ(id, topic, 'quick', 2, prompt, promptVi, choices, correct, explanation, 12);
});

console.log(`Authored ${extraQuestions.length} new questions.`);

const allQuestions = [...sampleQuestions, ...extraQuestions];
console.log(`Total questions in combined bank: ${allQuestions.length}`);

// Validation check
const ids = new Set();
const modes = {};
for (const q of allQuestions) {
  if (ids.has(q.id)) {
    throw new Error(`Duplicate question ID detected: ${q.id}`);
  }
  ids.add(q.id);
  modes[q.mode] = (modes[q.mode] || 0) + 1;
  if (!['A', 'B', 'C', 'D'].includes(q.correct)) {
    throw new Error(`Invalid correct letter in ${q.id}: ${q.correct}`);
  }
  if (!q.choices.A || !q.choices.B || !q.choices.C || !q.choices.D) {
    throw new Error(`Incomplete choices in ${q.id}`);
  }
}

console.log('Mode distribution in question bank:');
console.log(modes);

fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2), 'utf-8');
console.log(`Successfully saved ${allQuestions.length} questions to ${outputPath}!`);
