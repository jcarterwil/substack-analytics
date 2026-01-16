import ChartWrapper from "@/components/ChartWrapper";
import GeoChart from "@/components/GeoChart";
import { promises as fs } from "fs";
import path from "path";

interface GeoData {
  country: string;
  count: number;
}

async function getGeoData(): Promise<GeoData[]> {
  const filePath = path.join(process.cwd(), "public/data/geo-distribution.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

const countryNames: Record<string, string> = {
  US: "United States",
  NL: "Netherlands",
  GB: "United Kingdom",
  CA: "Canada",
  IN: "India",
  AU: "Australia",
  FR: "France",
  CH: "Switzerland",
  HK: "Hong Kong",
  NZ: "New Zealand",
  ES: "Spain",
  AE: "UAE",
  BE: "Belgium",
  MX: "Mexico",
  IE: "Ireland",
  DE: "Germany",
  IT: "Italy",
  SG: "Singapore",
  JP: "Japan",
  BR: "Brazil",
};

export default async function GeographyPage() {
  const geoData = await getGeoData();
  const totalOpens = geoData.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Geographic Distribution</h1>
        <p className="text-gray-500">Where your readers are opening emails</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Top Country</p>
          <p className="text-2xl font-bold text-gray-900">
            {countryNames[geoData[0]?.country] || geoData[0]?.country}
          </p>
          <p className="text-sm text-gray-400">
            {((geoData[0]?.count / totalOpens) * 100).toFixed(1)}% of opens
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Countries Reached</p>
          <p className="text-2xl font-bold text-gray-900">{geoData.length}+</p>
          <p className="text-sm text-gray-400">Unique countries</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">International Opens</p>
          <p className="text-2xl font-bold text-gray-900">
            {((1 - geoData[0]?.count / totalOpens) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-400">Outside primary country</p>
        </div>
      </div>

      {/* Bar Chart */}
      <ChartWrapper
        title="Opens by Country"
        subtitle="Top 15 countries by email opens"
      >
        <GeoChart data={geoData.slice(0, 15)} />
      </ChartWrapper>

      {/* Full Table */}
      <ChartWrapper title="All Countries">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-500">#</th>
                <th className="text-left py-3 font-medium text-gray-500">Country</th>
                <th className="text-right py-3 font-medium text-gray-500">Opens</th>
                <th className="text-right py-3 font-medium text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {geoData.map((geo, index) => (
                <tr key={geo.country} className="border-b border-gray-100">
                  <td className="py-3 text-gray-400">{index + 1}</td>
                  <td className="py-3 font-medium text-gray-900">
                    {countryNames[geo.country] || geo.country}
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {geo.count.toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {((geo.count / totalOpens) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartWrapper>
    </div>
  );
}
