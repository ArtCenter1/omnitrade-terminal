import React from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Preferences() {
  return (
    <ProfileLayout title="Preferences">
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-medium mb-4">Email</h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="weekly-email" defaultChecked />
              <label htmlFor="weekly-email" className="text-sm text-gray-300">
                Receive weekly Crypto Snapshot emails
              </label>
            </div>

            <div className="flex items-center space-x-2 ml-6">
              <Checkbox id="portfolio-stats" />
              <label
                htmlFor="portfolio-stats"
                className="text-sm text-gray-300"
              >
                Include my portfolio stats
              </label>
            </div>

            <div className="flex items-center space-x-2 ml-6">
              <Checkbox id="bot-summary" />
              <label htmlFor="bot-summary" className="text-sm text-gray-300">
                Include performance summary of my running bots
              </label>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium mb-4">Interface</h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-300 mb-2">Theme</p>
              <RadioGroup
                defaultValue="dark"
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="text-gray-300">
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="text-gray-300">
                    Light
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <p className="text-sm text-gray-300 mb-2">Order Notifications</p>
              <RadioGroup
                defaultValue="on"
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="on" id="notify-on" />
                  <Label htmlFor="notify-on" className="text-gray-300">
                    On
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="off" id="notify-off" />
                  <Label htmlFor="notify-off" className="text-gray-300">
                    Off
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <p className="text-sm text-gray-300 mb-2">Display Currency</p>
              <Select defaultValue="usd">
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="btc">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm text-gray-300 mb-2">
                Default Chart Timeframe
              </p>
              <Select defaultValue="1h">
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm text-gray-300 mb-2">
                Hide Small Balances Under
              </p>
              <div className="flex items-center">
                <Input
                  type="number"
                  defaultValue="0.01"
                  className="w-32 bg-gray-800 border-gray-700 text-white"
                />
                <span className="ml-2 text-gray-300">USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
