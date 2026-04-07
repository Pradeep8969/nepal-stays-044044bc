import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ThemeSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectTheme: (theme: "dark" | "light") => void
}

export function ThemeSelectionDialog({ isOpen, onClose, onSelectTheme }: ThemeSelectionDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Choose Your Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Select how you'd like Nepal Stays to appear:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => onSelectTheme("light")}
                className="w-full"
                variant="outline"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                  </div>
                  <span>Light</span>
                </div>
              </Button>
              
              <Button
                onClick={() => onSelectTheme("dark")}
                className="w-full"
                variant="outline"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gray-900"></div>
                  </div>
                  <span>Dark</span>
                </div>
              </Button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={onClose}
                className="w-full"
                variant="default"
              >
                Continue with Default
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
