from __future__ import annotations

from .periods import DayPeriodName
from .weather import WeatherMood

SCHEDULE_QUESTIONS: dict[DayPeriodName, str] = {
    "morning": "Sếp có cần em lên lịch trình cho công việc hôm nay không?",
    "noon": "Sếp có cần em sắp lại lịch chiều nay cho nhẹ và rõ ưu tiên hơn không?",
    "afternoon": "Sếp có cần em rà lại các việc còn lại trước cuối ngày không?",
    "evening": "Sếp có cần em tổng kết ngày hôm nay và lên kế hoạch cho ngày mai không?",
    "night": "Sếp có cần em chuyển sang chế độ yên tĩnh và ghi lại vài việc cho ngày mai không?",
}

LIFESTYLE_SUGGESTIONS: dict[DayPeriodName, dict[WeatherMood, str]] = {
    "morning": {
        "rainy": "Hôm nay có vẻ hợp với nhịp làm việc trong nhà hơn. Sếp có thể bắt đầu nhẹ bằng một ly nước ấm, vài trang sách, rồi em lên lịch công việc cho mình.",
        "hot": "Trời có vẻ nóng, sếp nên ưu tiên việc quan trọng vào buổi sáng, uống đủ nước và hạn chế ra ngoài lúc gần trưa.",
        "cold": "Sáng nay hơi lạnh, sếp nhớ giữ ấm. Em có thể sắp lịch theo nhịp chậm hơn một chút để mình vào guồng ổn định.",
        "pleasant": "Hôm nay thời tiết khá dễ chịu, sếp có thể ra ngoài đi dạo một chút hoặc ngắm cảnh để khởi động ngày mới.",
        "cloudy": "Sáng nay trời có mây, mình cứ khởi động ngày mới vừa phải. Sếp có thể đi bộ ngắn nếu ngoài trời vẫn khô ráo.",
        "unknown": "Em chưa chắc thời tiết chi tiết lúc này, nên mình cứ bắt đầu ngày mới nhẹ nhàng và để em sắp các việc quan trọng trước.",
    },
    "noon": {
        "rainy": "Trưa nay nếu ngoài trời mưa, sếp cứ nghỉ trong nhà, ăn gì ấm một chút. Em có thể lên thực đơn nhẹ và lịch chiều cho mình.",
        "hot": "Buổi trưa trời nóng thì sếp nên tránh ra ngoài, ăn nhẹ, uống nước và nghỉ 15 đến 20 phút trước khi quay lại việc.",
        "cold": "Trưa lạnh thì mình ưu tiên món ấm, nghỉ ngắn rồi em giúp sếp sắp lịch chiều theo mức năng lượng hiện tại.",
        "pleasant": "Giờ này sếp nên ăn trưa nhẹ, nghỉ mắt một chút. Nếu có thời gian, mình đi bộ ngắn vài phút cũng tốt.",
        "cloudy": "Trưa nay trời nhiều mây, sếp có thể nghỉ ngắn cho đầu óc dịu lại trước khi quay về các việc chiều.",
        "unknown": "Em chưa chắc thời tiết chi tiết lúc này, nhưng trưa nay sếp nên ăn nhẹ, nghỉ mắt và để em sắp lại nhịp chiều.",
    },
    "afternoon": {
        "rainy": "Chiều mưa hợp với các việc cần tập trung sâu. Em có thể gom các đầu việc còn lại thành danh sách ưu tiên.",
        "hot": "Chiều nóng dễ xuống năng lượng, sếp nên chia việc thành các phiên ngắn và để em nhắc nghỉ giữa phiên.",
        "cold": "Chiều lạnh thì mình giữ nhịp ổn định, ưu tiên hoàn thành các việc còn dang dở trước khi tối.",
        "pleasant": "Chiều nay thời tiết ổn, sếp có thể xử lý các việc cần tập trung trước, rồi dành ít phút ra ngoài hít thở.",
        "cloudy": "Chiều nay trời có mây, hợp để mình gom việc theo cụm và xử lý từng nhóm cho gọn.",
        "unknown": "Em chưa chắc thời tiết chi tiết lúc này, nên chiều nay mình ưu tiên các việc rõ mục tiêu và tránh ôm quá nhiều đầu việc.",
    },
    "evening": {
        "rainy": "Tối mưa hợp để ở nhà, đọc sách, nghe nhạc nhẹ hoặc tổng kết lại ngày hôm nay.",
        "hot": "Tối nóng thì sếp nên chọn hoạt động nhẹ, uống nước và để em giúp lọc lại việc quan trọng cho ngày mai.",
        "cold": "Tối lạnh thì mình nên nghỉ ngơi ấm áp hơn. Em có thể tổng kết ngày và gợi ý thực đơn nhẹ cho buổi tối.",
        "pleasant": "Tối nay nếu trời dễ chịu, sếp có thể đi dạo nhẹ hoặc ra ngoài đổi không khí một chút sau ngày làm việc.",
        "cloudy": "Tối nay trời nhiều mây, sếp có thể ở nhà thư giãn nhẹ, rồi mình tổng kết ngày cho đầu óc gọn lại.",
        "unknown": "Em chưa chắc thời tiết chi tiết lúc này, nhưng tối nay mình nên giảm nhịp, tổng kết ngày và chuẩn bị nhẹ cho ngày mai.",
    },
    "night": {
        "rainy": "Đêm mưa hợp để thả chậm lại. Sếp nên nghỉ, em sẽ giữ lại các việc cần nhớ cho ngày mai.",
        "hot": "Đêm nóng dễ khó ngủ, sếp nên giảm ánh sáng màn hình, uống ít nước và để cơ thể hạ nhịp.",
        "cold": "Đêm lạnh thì sếp giữ ấm nhé. Em khuyên mình dừng việc nặng và để em chuẩn bị ghi chú cho sáng mai.",
        "pleasant": "Đêm muộn rồi, sếp nên ưu tiên nghỉ ngơi. Nếu còn việc, em có thể ghi nhanh lại để sáng xử lý.",
        "cloudy": "Đêm nay mình nên thả chậm, tắt bớt nhiễu và để em giữ lại các việc cần nhớ cho sáng mai.",
        "unknown": "Giờ này đã muộn, sếp nên ưu tiên nghỉ ngơi. Nếu còn điều gì dang dở, em có thể ghi lại để sáng xử lý.",
    },
}

MEAL_SUGGESTIONS: dict[DayPeriodName, str] = {
    "morning": "Em cũng có thể gợi ý bữa sáng nhẹ để mình vào ngày tỉnh táo hơn.",
    "noon": "Em sẽ lên thực đơn trưa nay cho chúng ta theo thời tiết hiện tại.",
    "afternoon": "Nếu sếp cần, em sẽ chuẩn bị gợi ý món nhẹ để giữ năng lượng buổi chiều.",
    "evening": "Em sẽ lên thực đơn tối nay cho chúng ta, ưu tiên món nhẹ và dễ nghỉ ngơi.",
    "night": "Giờ này mình không nên ăn nặng; nếu cần, em chỉ gợi ý đồ uống ấm hoặc món rất nhẹ.",
}


def get_schedule_question(period: DayPeriodName) -> str:
    return SCHEDULE_QUESTIONS[period]


def get_lifestyle_suggestion(period: DayPeriodName, mood: WeatherMood) -> str:
    return LIFESTYLE_SUGGESTIONS[period][mood]


def get_meal_suggestion(period: DayPeriodName) -> str:
    return MEAL_SUGGESTIONS[period]
