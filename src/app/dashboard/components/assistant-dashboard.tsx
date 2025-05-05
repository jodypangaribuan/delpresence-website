"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function AssistantDashboard() {
  return (
    <div className="space-y-8">
      {/* Empty dashboard */}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  href,
  textColor,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  textColor: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-6 bg-white border border-gray-100 hover:shadow-md transition-all rounded-lg h-full">
        <div className="flex flex-col h-full">
          <div className="flex items-center">
            <div className={`p-2 rounded-full bg-gray-50`}>{icon}</div>
            <h3 className={`ml-3 font-medium ${textColor}`}>{title}</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
      </Card>
    </Link>
  );
}

function NotificationItem({
  title,
  description,
  time,
  icon,
  href,
}: {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="p-2 rounded-full bg-gray-100">{icon}</div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
          <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
      </div>
    </Link>
  );
} 