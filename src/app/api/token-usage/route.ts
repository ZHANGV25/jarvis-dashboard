import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// All dates are converted to Eastern Time (EST/EDT) for consistency with user's timezone

// Model cost per 1K tokens (input/output) in USD
const MODEL_COSTS = {
  'us.anthropic.claude-sonnet-4-20250514-v1:0': { input: 0.003, output: 0.015 },
  'us.anthropic.claude-haiku-4-5-20251001-v1:0': { input: 0.00025, output: 0.00125 },
  'anthropic.claude-opus-4-6-v1': { input: 0.015, output: 0.075 },
  'amazon-bedrock/us.anthropic.claude-sonnet-4-20250514-v1:0': { input: 0.003, output: 0.015 },
  'amazon-bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0': { input: 0.00025, output: 0.00125 },
  'amazon-bedrock/anthropic.claude-opus-4-6-v1': { input: 0.015, output: 0.075 },
};

function getModelDisplayName(model: string): string {
  if (model.includes('haiku')) return 'Haiku';
  if (model.includes('sonnet')) return 'Sonnet';
  if (model.includes('opus')) return 'Opus';
  return model.split('/').pop() || model;
}

function getSessionType(sessionKey: string, label?: string): string {
  if (sessionKey.includes(':cron:')) return 'Cron Job';
  if (sessionKey.includes(':discord:')) return 'Discord';
  if (sessionKey.includes(':telegram:')) return 'Telegram';
  if (sessionKey === 'agent:main:main') return 'Main Session';
  if (label) return label;
  return 'Other';
}

function toESTDate(timestamp: number): string {
  // Convert UTC timestamp to Eastern Time (EST/EDT) and get the date
  const date = new Date(timestamp);
  const estDateString = date.toLocaleDateString("en-CA", {timeZone: "America/New_York"}); // YYYY-MM-DD format
  return estDateString;
}

export async function GET() {
  try {
    const sessionsPath = '/home/ubuntu/.openclaw/agents/main/sessions/sessions.json';
    const sessionsData = JSON.parse(readFileSync(sessionsPath, 'utf-8'));
    
    const sessions = Object.entries(sessionsData).map(([sessionKey, data]: [string, any]) => ({
      sessionKey,
      sessionType: getSessionType(sessionKey, data.label),
      label: data.label || sessionKey,
      model: getModelDisplayName(data.model || 'unknown'),
      modelFull: data.model || 'unknown',
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      totalTokens: data.totalTokens || 0,
      updatedAt: data.updatedAt || 0,
      date: data.updatedAt ? toESTDate(data.updatedAt) : 'unknown',
    }));

    // Aggregate by date
    const byDate = sessions.reduce((acc, session) => {
      if (!acc[session.date]) {
        acc[session.date] = {
          date: session.date,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          sessions: 0,
          models: {},
          types: {},
          cost: 0,
        };
      }
      
      const day = acc[session.date];
      day.inputTokens += session.inputTokens;
      day.outputTokens += session.outputTokens;
      day.totalTokens += session.totalTokens;
      day.sessions += 1;
      
      // Track by model
      if (!day.models[session.model]) {
        day.models[session.model] = { inputTokens: 0, outputTokens: 0, sessions: 0, cost: 0 };
      }
      day.models[session.model].inputTokens += session.inputTokens;
      day.models[session.model].outputTokens += session.outputTokens;
      day.models[session.model].sessions += 1;
      
      // Track by type
      if (!day.types[session.sessionType]) {
        day.types[session.sessionType] = { inputTokens: 0, outputTokens: 0, sessions: 0, cost: 0 };
      }
      day.types[session.sessionType].inputTokens += session.inputTokens;
      day.types[session.sessionType].outputTokens += session.outputTokens;
      day.types[session.sessionType].sessions += 1;
      
      // Calculate cost
      const modelCost = MODEL_COSTS[session.modelFull] || MODEL_COSTS['us.anthropic.claude-sonnet-4-20250514-v1:0'];
      const sessionCost = (session.inputTokens / 1000) * modelCost.input + (session.outputTokens / 1000) * modelCost.output;
      day.cost += sessionCost;
      day.models[session.model].cost += sessionCost;
      day.types[session.sessionType].cost += sessionCost;
      
      return acc;
    }, {} as any);

    // Sort by date (most recent first)
    const sortedDays = Object.values(byDate).sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate totals
    const totals = sessions.reduce((acc, session) => {
      acc.inputTokens += session.inputTokens;
      acc.outputTokens += session.outputTokens;
      acc.totalTokens += session.totalTokens;
      acc.sessions += 1;
      
      const modelCost = MODEL_COSTS[session.modelFull] || MODEL_COSTS['us.anthropic.claude-sonnet-4-20250514-v1:0'];
      const sessionCost = (session.inputTokens / 1000) * modelCost.input + (session.outputTokens / 1000) * modelCost.output;
      acc.cost += sessionCost;
      
      return acc;
    }, { inputTokens: 0, outputTokens: 0, totalTokens: 0, sessions: 0, cost: 0 });

    // Aggregate by model (all time)
    const byModel = sessions.reduce((acc, session) => {
      if (!acc[session.model]) {
        acc[session.model] = { inputTokens: 0, outputTokens: 0, sessions: 0, cost: 0 };
      }
      acc[session.model].inputTokens += session.inputTokens;
      acc[session.model].outputTokens += session.outputTokens;
      acc[session.model].sessions += 1;
      
      const modelCost = MODEL_COSTS[session.modelFull] || MODEL_COSTS['us.anthropic.claude-sonnet-4-20250514-v1:0'];
      const sessionCost = (session.inputTokens / 1000) * modelCost.input + (session.outputTokens / 1000) * modelCost.output;
      acc[session.model].cost += sessionCost;
      
      return acc;
    }, {} as any);

    // Aggregate by session type (all time)
    const byType = sessions.reduce((acc, session) => {
      if (!acc[session.sessionType]) {
        acc[session.sessionType] = { inputTokens: 0, outputTokens: 0, sessions: 0, cost: 0 };
      }
      acc[session.sessionType].inputTokens += session.inputTokens;
      acc[session.sessionType].outputTokens += session.outputTokens;
      acc[session.sessionType].sessions += 1;
      
      const modelCost = MODEL_COSTS[session.modelFull] || MODEL_COSTS['us.anthropic.claude-sonnet-4-20250514-v1:0'];
      const sessionCost = (session.inputTokens / 1000) * modelCost.input + (session.outputTokens / 1000) * modelCost.output;
      acc[session.sessionType].cost += sessionCost;
      
      return acc;
    }, {} as any);

    return NextResponse.json({
      totals,
      byDate: sortedDays,
      byModel,
      byType,
      sessions: sessions.slice(0, 50), // Recent sessions for debugging
      modelCosts: MODEL_COSTS,
    });
  } catch (error) {
    console.error('Token usage API error:', error);
    return NextResponse.json({ error: 'Failed to fetch token usage' }, { status: 500 });
  }
}