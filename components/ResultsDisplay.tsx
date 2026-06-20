import React from 'react';
import { Lightbulb, Film, Hash, Megaphone } from 'lucide-react';
import { GenerationResponse, PlatformOutput, ScriptSegment } from '../types';
import CopyButton from './CopyButton';

interface ResultsDisplayProps {
  data: GenerationResponse;
}

const FrameworkPill: React.FC<{ name: string }> = ({ name }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30">
    {name}
  </span>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; copyText?: string }> = ({
  icon,
  title,
  copyText,
}) => (
  <div className="flex items-center justify-between mb-2">
    <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
      {icon}
      {title}
    </span>
    {copyText && <CopyButton text={copyText} />}
  </div>
);

const scriptToText = (segments: ScriptSegment[]) =>
  segments.map((s) => `${s.label.toUpperCase()}\n${s.text}`).join('\n\n');

const PlatformCard: React.FC<{ output: PlatformOutput }> = ({ output }) => {
  const hasScript = output.videoScript && output.videoScript.length > 0;
  const hasCaption = output.caption || (output.hashtags && output.hashtags.length > 0);
  const hasAd = !!output.adCopy;

  return (
    <div className="bg-[#16161a] border border-gray-800 rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{output.platform}</h3>
        <FrameworkPill name={output.framework} />
      </div>

      {hasScript && (
        <div>
          <SectionHeader
            icon={<Film size={15} className="text-indigo-400" />}
            title="Video Script"
            copyText={scriptToText(output.videoScript!)}
          />
          <div className="space-y-2.5">
            {output.videoScript!.map((seg, i) => (
              <div key={i} className="border-l-2 border-indigo-500/40 pl-3">
                <span className="block text-[11px] uppercase tracking-wide font-semibold text-indigo-400">
                  {seg.label}
                </span>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCaption && (
        <div>
          <SectionHeader
            icon={<Hash size={15} className="text-indigo-400" />}
            title="Caption + Hashtags"
            copyText={`${output.caption ?? ''}${
              output.hashtags && output.hashtags.length ? '\n\n' + output.hashtags.map((h) => `#${h}`).join(' ') : ''
            }`}
          />
          {output.caption && <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3">{output.caption}</p>}
          {output.hashtags && output.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {output.hashtags.map((tag, i) => (
                <span key={i} className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {hasAd && (
        <div>
          <SectionHeader
            icon={<Megaphone size={15} className="text-indigo-400" />}
            title="Full Ad Copy"
            copyText={`${output.adCopy!.headline}\n\n${output.adCopy!.body}\n\n${output.adCopy!.cta}`}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">{output.adCopy!.headline}</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{output.adCopy!.body}</p>
            <p className="text-sm font-medium text-indigo-300">→ {output.adCopy!.cta}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Recommendation banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={18} className="text-yellow-400" />
          <h2 className="text-base font-semibold text-white">Recommended framework</h2>
          <div className="flex gap-1.5">
            {data.recommendation.frameworks.map((f) => (
              <FrameworkPill key={f} name={f} />
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-300">{data.recommendation.rationale}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data.outputs.map((output, i) => (
          <PlatformCard key={`${output.platform}-${i}`} output={output} />
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;
