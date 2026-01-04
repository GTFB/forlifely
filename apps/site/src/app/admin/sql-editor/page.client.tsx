"use client"

import * as React from "react"
import { AppSidebar } from "@/components/application-blocks/app-sidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Play, RotateCcw, CheckCircle2, XCircle, AlertCircle, Terminal } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function SqlEditorPageClient() {
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<{
    data: any[]
    rowCount: number
    columns: string[]
  } | null>(null)
  const [executionTime, setExecutionTime] = React.useState<number | null>(null)

  const handleExecute = async () => {
    if (!query.trim()) {
      setError("Please enter a SQL query")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setExecutionTime(null)

    const startTime = Date.now()

    try {
      const response = await fetch("/api/altrp/v1/admin/sql/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: query.trim(),
        }),
      })

      const endTime = Date.now()
      setExecutionTime(endTime - startTime)

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to execute query")
      }

      setResult({
        data: data.data || [],
        rowCount: data.rowCount || 0,
        columns: data.columns || [],
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute query"
      setError(errorMessage)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery("")
    setError(null)
    setResult(null)
    setExecutionTime(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void handleExecute()
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AdminHeader title="SQL Editor" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">SQL Editor</h1>
                <p className="text-muted-foreground mt-2">
                  Execute SQL queries against the database. Only SELECT, INSERT, UPDATE, and DELETE queries are allowed.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Query</CardTitle>
                      <CardDescription>
                        Enter your SQL query. Press Ctrl+Enter (Cmd+Enter on Mac) to execute.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        disabled={loading}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        onClick={handleExecute}
                        disabled={loading || !query.trim()}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="SELECT * FROM users LIMIT 10;"
                    className="font-mono text-sm min-h-[200px]"
                    disabled={loading}
                  />
                </CardContent>
              </Card>

              {result && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>
                          {result.rowCount} row{result.rowCount !== 1 ? "s" : ""} returned
                          {executionTime !== null && ` • ${executionTime}ms`}
                        </CardDescription>
                      </div>
                      {result.rowCount > 0 && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.rowCount === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Query executed successfully but returned no rows.
                      </div>
                    ) : (
                      <ScrollArea className="w-full">
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {result.columns.map((column) => (
                                  <TableHead key={column} className="font-mono text-xs">
                                    {column}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.data.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  {result.columns.map((column) => {
                                    const value = row[column]
                                    const displayValue =
                                      value === null || value === undefined
                                        ? (
                                            <span className="text-muted-foreground italic">NULL</span>
                                          )
                                        : typeof value === "object"
                                          ? JSON.stringify(value)
                                          : String(value)
                                    return (
                                      <TableCell
                                        key={column}
                                        className="font-mono text-xs max-w-[300px] break-all"
                                      >
                                        {displayValue}
                                      </TableCell>
                                    )
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              )}

              {!result && !loading && !error && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter a SQL query above and click Execute to see results.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

