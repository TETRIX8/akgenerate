# README: Генерация изображений с интеграцией FusionBrain AI

## Описание проекта
Этот проект предоставляет удобный интерфейс для генерации изображений с использованием API сервиса FusionBrain AI. Вы можете создавать уникальные изображения по текстовому описанию (prompt) с различными настройками.

## Интеграция с FusionBrain AI
Проект использует API от [FusionBrain AI](https://fusionbrain.ai) - российского сервиса генерации изображений с помощью искусственного интеллекта.

## Как запустить проект

### Предварительные требования
1. Зарегистрируйтесь на [FusionBrain AI](https://fusionbrain.ai/)
2. Получите API-ключ в личном кабинете
3. Убедитесь, что у вас установлен Python 3.8 или новее

### Установка
1. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-репозиторий/генератор-изображений.git
cd генератор-изображений
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` и добавьте ваш API-ключ:
```
FUSIONBRAIN_API_KEY=ваш_ключ_здесь
FUSIONBRAIN_SECRET_KEY=ваш_секретный_ключ_здесь
```

### Запуск
1. Запустите основной скрипт:
```bash
python main.py
```

2. Следуйте инструкциям в консоли для генерации изображений

## Использование API FusionBrain AI
Для прямого использования API FusionBrain AI:

1. Получите токен авторизации:
```python
import requests

url = "https://fusionbrain.ai/api/v1/auth"
headers = {
    "X-Key": f"Key {API_KEY}",
    "X-Secret": f"Secret {SECRET_KEY}",
}
response = requests.post(url, headers=headers)
token = response.json()["token"]
```

2. Отправьте запрос на генерацию:
```python
url = "https://fusionbrain.ai/api/v1/text2image/run"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}
data = {
    "style": "DEFAULT",
    "width": 1024,
    "height": 1024,
    "generateParams": {
        "query": "красивая картинка с горами и озером"
    }
}
response = requests.post(url, headers=headers, json=data)
uuid = response.json()["uuid"]
```

3. Получите результат:
```python
url = f"https://fusionbrain.ai/api/v1/text2image/status/{uuid}"
response = requests.get(url, headers=headers)
if response.json()["status"] == "DONE":
    image_base64 = response.json()["images"][0]
```

## Настройки генерации
Доступные параметры:
- `style`: стиль изображения (DEFAULT, KANDINSKY, UHD, ANIME и др.)
- `width`: ширина изображения (до 1024)
- `height`: высота изображения (до 1024)
- `generateParams.query`: текстовое описание изображения

## Примеры использования
```python
# Генерация пейзажа
generate_image("Закат над морем, импрессионизм", style="KANDINSKY")

# Генерация портрета
generate_image("Портрет кота в шляпе, стиль пиксель-арт", style="UHD")
```

## Ограничения
- Бесплатная версия имеет лимиты на количество запросов
- Максимальный размер изображения - 1024x1024
- Время генерации может занимать от нескольких секунд до минут

## Лицензия
Проект распространяется под лицензией MIT. Использование API FusionBrain AI регулируется условиями сервиса.
