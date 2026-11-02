import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sofra.ly';

  const cities = ['tripoli', 'benghazi', 'misrata', 'sabha', 'zawia', 'zlitin'];
  const categories = ['popular-food', 'sweets-baklava', 'cakes-events', 'pastries-sheet'];

  const cityUrls: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${baseUrl}/explore?city=${city}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/explore?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/chefs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reels`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    ...cityUrls,
    ...categoryUrls,
  ];
}
