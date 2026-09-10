export interface WeatherData {
  status: 'available' | 'weather_unavailable';
  temperature?: number;
  relativeHumidity?: number;
  precipitation?: number;
  windSpeed?: number;
  weatherCode?: number;
  isHighHumidity?: boolean;
  isRecentRain?: boolean;
  fetchedAt: string;
}

/**
 * Fetches current weather from Open-Meteo API for given lat/lng.
 * Timeout: 5000ms. Graceful fallback on network failure or timeout.
 */
export async function fetchDistrictWeather(lat: number, lng: number): Promise<WeatherData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        status: 'weather_unavailable',
        fetchedAt: new Date().toISOString(),
      };
    }

    const data = await res.json();
    const current = data.current;

    if (!current) {
      return {
        status: 'weather_unavailable',
        fetchedAt: new Date().toISOString(),
      };
    }

    const temperature = current.temperature_2m;
    const relativeHumidity = current.relative_humidity_2m;
    const precipitation = current.precipitation;
    const windSpeed = current.wind_speed_10m;
    const weatherCode = current.weather_code;

    return {
      status: 'available',
      temperature,
      relativeHumidity,
      precipitation,
      windSpeed,
      weatherCode,
      isHighHumidity: relativeHumidity !== undefined && relativeHumidity >= 75,
      isRecentRain: precipitation !== undefined && precipitation > 0.5,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    // Graceful fallback — never break caller
    return {
      status: 'weather_unavailable',
      fetchedAt: new Date().toISOString(),
    };
  }
}

