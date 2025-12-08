"use client";

import { type FC } from "react";
import AdvertisementDisplay from "./AdvertisementDisplay";

// ResultDisplay component for showing check results

interface ResultDisplayProps {
  result: any;
  loading?: boolean;
}

// Helper function to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length < 2) return "🌐";
  const code = countryCode.substring(0, 2).toUpperCase();
  if (code.length !== 2) return "🌐";
  try {
    const codePoints = code.split("").map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

// Helper function to process ping results
function processPingResults(pingResults: any[][]): {
  successCount: number;
  totalCount: number;
  minTime: number;
  avgTime: number;
  maxTime: number;
  ip: string | null;
} {
  if (!pingResults || !Array.isArray(pingResults) || pingResults.length === 0) {
    return { successCount: 0, totalCount: 0, minTime: 0, avgTime: 0, maxTime: 0, ip: null };
  }

  // Flatten the array of arrays
  const allResults = pingResults.flat().filter((r: any) => r !== null && r !== undefined);
  const totalCount = allResults.length;
  
  if (totalCount === 0) {
    return { successCount: 0, totalCount: 0, minTime: 0, avgTime: 0, maxTime: 0, ip: null };
  }

  const successResults = allResults.filter((r: any) => r?.status === "OK");
  const successCount = successResults.length;

  // Get IP from any result (successful or not) - prioritize successful results
  const ip = successResults.find((r: any) => r?.ip)?.ip || 
             allResults.find((r: any) => r?.ip)?.ip || 
             null;

  // Calculate times from successful results only
  // Include time: 0 as valid (might be very fast ping or parsing issue)
  const times = successResults
    .map((r: any) => {
      if (r?.time !== undefined && r.time !== null && r.time >= 0) {
        // Time is in seconds from ping service (parsePingTime divides by 1000)
        // Always convert to milliseconds by multiplying by 1000
        const timeMs = r.time * 1000;
        return timeMs;
      }
      return null;
    })
    .filter((t: number | null) => t !== null && t >= 0) as number[];

  if (times.length === 0) {
    return { successCount, totalCount, minTime: 0, avgTime: 0, maxTime: 0, ip };
  }

  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

  return { successCount, totalCount, minTime, avgTime, maxTime, ip };
}

// Helper function to process HTTP results
function processHTTPResults(httpResults: any[][]): {
  success: boolean;
  time: number;
  statusCode: string | null;
  message: string;
  ip: string | null;
} {
  if (!httpResults || !Array.isArray(httpResults) || httpResults.length === 0) {
    return { success: false, time: 0, statusCode: null, message: "No data", ip: null };
  }

  const allResults = httpResults.flat().filter((r: any) => r !== null && r !== undefined);
  if (allResults.length === 0) {
    return { success: false, time: 0, statusCode: null, message: "No data", ip: null };
  }

  const firstResult = allResults[0];
  return {
    success: firstResult.success === 1 || firstResult.success === true,
    time: firstResult.time || 0,
    statusCode: firstResult.statusCode || null,
    message: firstResult.message || "Unknown",
    ip: firstResult.ip || null,
  };
}

// Helper function to process TCP/UDP results
function processPortResults(portResults: any[]): {
  success: boolean;
  time: number | null;
  address: string | null;
  error: string | null;
  note: string | null;
} {
  if (!portResults || !Array.isArray(portResults) || portResults.length === 0) {
    return { success: false, time: null, address: null, error: "No data", note: null };
  }

  const firstResult = portResults[0];
  return {
    success: !firstResult.error && firstResult.time !== undefined,
    time: firstResult.time || null,
    address: firstResult.address || null,
    error: firstResult.error || null,
    note: firstResult.note || null,
  };
}

// Helper function to process DNS results
function processDNSResults(dnsResults: any[]): {
  aRecords: string[];
  aaaaRecords: string[];
  ttl: number | null;
} {
  if (!dnsResults || !Array.isArray(dnsResults) || dnsResults.length === 0) {
    return { aRecords: [], aaaaRecords: [], ttl: null };
  }

  const allRecords = dnsResults.flat();
  const aRecords: string[] = [];
  const aaaaRecords: string[] = [];
  let ttl: number | null = null;

  allRecords.forEach((record: any) => {
    if (record.A && Array.isArray(record.A)) {
      aRecords.push(...record.A);
    }
    if (record.AAAA && Array.isArray(record.AAAA)) {
      aaaaRecords.push(...record.AAAA);
    }
    if (record.TTL !== undefined) {
      ttl = record.TTL;
    }
  });

  return { aRecords: [...new Set(aRecords)], aaaaRecords: [...new Set(aaaaRecords)], ttl };
}

const ResultDisplay: FC<ResultDisplayProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Processing...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (result.error) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Error</h2>
          </div>
          <p className="mt-2 text-red-700 dark:text-red-300">{result.error}</p>
        </div>
      </div>
    );
  }

  const results = result.results || (Array.isArray(result) ? result : [result]);
  
  // Debug: Log to help diagnose (moved outside useEffect to avoid React 19 issues)
  if (typeof window !== 'undefined' && results.length > 0) {
    console.log('ResultDisplay - Full result structure:', {
      firstResult: results[0],
      resultResult: results[0]?.result,
      resultResultResult: results[0]?.result?.result,
      checkType: results[0]?.result?.checkType,
    });
    // Log DNS-specific data
    if (results[0]?.result?.checkType === 'dns') {
      console.log('DNS Result Data:', JSON.stringify(results[0]?.result?.result, null, 2));
    }
  }
  
  if (results.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 text-center">No results available</p>
        </div>
      </div>
    );
  }

  // Determine check type from first result
  const checkType = results[0]?.result?.checkType || 'unknown';

  // Special handling for IP Info - display as cards
  if (checkType === 'ip-info') {
    const ipInfoData = results
      .filter((item: any) => item.result?.result)
      .flatMap((item: any) => {
        const ipInfoResults = Array.isArray(item.result.result) ? item.result.result : [item.result.result];
        return ipInfoResults.map((info: any) => ({
          ...info,
          agent: item.agent,
        }));
      })
      .filter((info: any) => info && info.ip);

    if (ipInfoData.length === 0) {
      return (
        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 text-center">No IP information available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto mt-8 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              IP Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ipInfoData.map((info: any, index: number) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="space-y-2">
                    {info.ip && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">IP Address</div>
                        <div className="text-sm font-mono text-slate-900 dark:text-slate-100">{info.ip}</div>
                      </div>
                    )}
                    {info.country && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Country</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{info.country} {info.countryCode ? `(${info.countryCode})` : ''}</div>
                      </div>
                    )}
                    {info.city && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">City</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{info.city}</div>
                      </div>
                    )}
                    {info.region && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Region</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{info.region}</div>
                      </div>
                    )}
                    {info.isp && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">ISP</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{info.isp}</div>
                      </div>
                    )}
                    {info.organization && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Organization</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{info.organization}</div>
                      </div>
                    )}
                    {info.timezone && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Timezone</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{info.timezone}</div>
                      </div>
                    )}
                    {info.source && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Source</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{info.source}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Build table data based on check type
  let tableData: any[] = [];
  let tableHeaders: string[] = [];

  if (checkType === 'ping') {
    tableHeaders = ['Location', 'Result', 'rtt min / avg / max', 'IP address'];
    tableData = results
      .filter((item: any) => {
        const hasData = item.agent && item.result && item.result.result;
        if (!hasData) {
          console.warn('Filtered out item:', { hasAgent: !!item.agent, hasResult: !!item.result, hasResultData: !!item.result?.result });
        }
        return hasData;
      })
      .map((item: any) => {
        let pingResultData = item.result?.result;
        
        // Debug logging
        // Normalize ping result data structure
        if (!pingResultData) {
          pingResultData = [];
        } else if (!Array.isArray(pingResultData)) {
          // Single object, wrap it
          pingResultData = [[pingResultData]];
        } else if (pingResultData.length > 0 && !Array.isArray(pingResultData[0])) {
          // Flat array of objects, wrap it
          pingResultData = [pingResultData];
        }
        // Otherwise it's already [[...]]
        
        const pingData = processPingResults(pingResultData);
        
        const agent = item.agent || {};
        
        const locationParts = [];
        if (agent.agentCountry) locationParts.push(agent.agentCountry);
        if (agent.agentCity) locationParts.push(agent.agentCity);
        const location = locationParts.length > 0 
          ? locationParts.join(", ") 
          : (agent.name || agent.agentLocation || "Unknown");
        
        const countryCode = agent.agentCountryCode 
          ? agent.agentCountryCode.toUpperCase()
          : (agent.agentCountry && agent.agentCountry.length >= 2
              ? agent.agentCountry.substring(0, 2).toUpperCase()
              : "");

        // Try to get IP from ping data
        let displayIP = pingData.ip;
        
        // If no IP from ping results, try to extract from raw ping data (even failed pings might have IP)
        if (!displayIP) {
          const rawData = item.result?.result;
          if (Array.isArray(rawData) && rawData.length > 0) {
            const firstArray = Array.isArray(rawData[0]) ? rawData[0] : rawData;
            if (Array.isArray(firstArray)) {
              // Check all results for IP, not just first one
              for (const pingResult of firstArray) {
                if (pingResult?.ip) {
                  displayIP = pingResult.ip;
                  break;
                }
              }
            }
          }
        }
        
        // Fallback: check if host is an IP address, or try to resolve it
        if (!displayIP && item.result?.host) {
          const host = item.result.host;
          const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
          if (ipRegex.test(host)) {
            displayIP = host;
          }
          // Note: We can't resolve hostname in browser, worker should have done it
          // But we can show "Resolving..." or the hostname itself as fallback
        }
        
        // Last resort: show hostname if no IP found
        if (!displayIP && item.result?.host) {
          displayIP = item.result.host;
        }

        return {
          location,
          countryCode,
          countryEmoji: agent.countryEmoji,
          result: `${pingData.successCount} / ${pingData.totalCount}`,
          rtt: pingData.successCount > 0 
            ? `${pingData.minTime.toFixed(1)} / ${pingData.avgTime.toFixed(1)} / ${pingData.maxTime.toFixed(1)} ms`
            : "—",
          ip: displayIP || "—",
        };
      });
  } else if (checkType === 'http') {
    tableHeaders = ['Location', 'Result', 'Time', 'Status code', 'IP address'];
    tableData = results
      .filter((item: any) => item.agent && item.result)
      .map((item: any) => {
        let httpResultData = item.result?.result;
        if (!httpResultData) httpResultData = [];
        else if (!Array.isArray(httpResultData)) httpResultData = [[httpResultData]];
        else if (httpResultData.length > 0 && !Array.isArray(httpResultData[0])) httpResultData = [httpResultData];
        
        const httpData = processHTTPResults(httpResultData);
        const agent = item.agent || {};
        
        const locationParts = [];
        if (agent.agentCountry) locationParts.push(agent.agentCountry);
        if (agent.agentCity) locationParts.push(agent.agentCity);
        const location = locationParts.length > 0 
          ? locationParts.join(", ") 
          : (agent.name || agent.agentLocation || "Unknown");
        
        const countryCode = agent.agentCountryCode 
          ? agent.agentCountryCode.toUpperCase()
          : (agent.agentCountry && agent.agentCountry.length >= 2
              ? agent.agentCountry.substring(0, 2).toUpperCase()
              : "");

        return {
          location,
          countryCode,
          countryEmoji: agent.countryEmoji,
          result: httpData.success ? "✓ OK" : "✗ Error",
          time: httpData.time > 0 ? `${(httpData.time * 1000).toFixed(0)} ms` : "—",
          statusCode: httpData.statusCode || "—",
          ip: httpData.ip || "—",
        };
      });
  } else if (checkType === 'tcp' || checkType === 'udp') {
    tableHeaders = ['Location', 'Result', 'Time', 'IP address'];
    tableData = results
      .filter((item: any) => item.agent && item.result)
      .map((item: any) => {
        const portData = processPortResults(item.result?.result || []);
        const agent = item.agent || {};
        
        const locationParts = [];
        if (agent.agentCountry) locationParts.push(agent.agentCountry);
        if (agent.agentCity) locationParts.push(agent.agentCity);
        const location = locationParts.length > 0 
          ? locationParts.join(", ") 
          : (agent.name || agent.agentLocation || "Unknown");
        
        const countryCode = agent.agentCountryCode 
          ? agent.agentCountryCode.toUpperCase()
          : (agent.agentCountry && agent.agentCountry.length >= 2
              ? agent.agentCountry.substring(0, 2).toUpperCase()
              : "");

        return {
          location,
          countryCode,
          countryEmoji: agent.countryEmoji,
          result: portData.success ? "✓ OK" : (portData.error || "✗ Error"),
          time: portData.time ? `${(portData.time * 1000).toFixed(0)} ms` : "—",
          ip: portData.address || "—",
        };
      });
  } else if (checkType === 'dns') {
    tableHeaders = ['Location', 'A records', 'AAAA records', 'TTL'];
    tableData = results
      .filter((item: any) => item.agent && item.result)
      .map((item: any) => {
        const dnsData = processDNSResults(item.result?.result || []);
        const agent = item.agent || {};
        
        const locationParts = [];
        if (agent.agentCountry) locationParts.push(agent.agentCountry);
        if (agent.agentCity) locationParts.push(agent.agentCity);
        const location = locationParts.length > 0 
          ? locationParts.join(", ") 
          : (agent.name || agent.agentLocation || "Unknown");
        
        const countryCode = agent.agentCountryCode 
          ? agent.agentCountryCode.toUpperCase()
          : (agent.agentCountry && agent.agentCountry.length >= 2
              ? agent.agentCountry.substring(0, 2).toUpperCase()
              : "");

        return {
          location,
          countryCode,
          countryEmoji: agent.countryEmoji,
          aRecords: dnsData.aRecords.length > 0 ? dnsData.aRecords.join(", ") : "—",
          aaaaRecords: dnsData.aaaaRecords.length > 0 ? dnsData.aaaaRecords.join(", ") : "—",
          ttl: dnsData.ttl ? `${dnsData.ttl} s` : "—",
        };
      });
  }

  if (tableData.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 text-center">
            No results available
            <span className="block text-xs mt-2 text-slate-500">
              Check type: {checkType}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 animate-fade-in">
      <AdvertisementDisplay position="above_table" />
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Results
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {tableHeaders.map((header, idx) => (
                  <th key={idx} className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-xl mr-2" role="img" aria-label={row.countryCode}>
                        {row.countryEmoji || getCountryFlag(row.countryCode)}
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {row.location}
                      </span>
                    </div>
                  </td>
                  {checkType === 'ping' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                          {row.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.rtt}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.ip}
                        </span>
                      </td>
                    </>
                  )}
                  {checkType === 'http' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${row.result.includes('OK') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {row.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.time}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.ip}
                        </span>
                      </td>
                    </>
                  )}
                  {(checkType === 'tcp' || checkType === 'udp') && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${row.result.includes('OK') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {row.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.time}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.ip}
                        </span>
                      </td>
                    </>
                  )}
                  {checkType === 'dns' && (
                    <>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.aRecords}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.aaaaRecords}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {row.ttl}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AdvertisementDisplay position="below_table" />
    </div>
  );
};

export default ResultDisplay;
