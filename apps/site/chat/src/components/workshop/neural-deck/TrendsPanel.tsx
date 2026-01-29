"use client";

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { TextResponse } from "@/shared/types/shared";

interface Trend {
  taid: string;
  title: string;
  content: string;
  gin?: {
    trends?: string[];
    recommendations?: string[];
  };
}

export function TrendsPanel() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshop/trends");
      if (response.ok) {
        const data = await response.json() as { trends?: TextResponse[] };
        setTrends((data.trends || []) as Trend[]);
      }
    } catch (error) {
      console.error("Failed to load trends:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading trends...
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {trends.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trends available</p>
            <p className="text-sm mt-2">Trends will appear here when available</p>
          </div>
        ) : (
          trends.map((trend) => (
            <Card key={trend.taid}>
              <CardHeader>
                <CardTitle className="text-sm">{trend.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{trend.content}</p>
                {trend.gin?.trends && trend.gin.trends.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Popular Tropes:</p>
                    <div className="flex flex-wrap gap-1">
                      {trend.gin.trends.map((trope, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {trope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {trend.gin?.recommendations && trend.gin.recommendations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium">Recommendations:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {trend.gin.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

