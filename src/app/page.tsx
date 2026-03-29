export default function HomePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">CogniSync-Readiness</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        科学的に検証された2つの認知タスクを使って、あなたの「認知的レディネス（準備状態）」を客観的に計測するツールです。
      </p>

      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-2">⏱ PVT（精神運動覚醒課題）</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            持続的注意力と覚醒度を、カウントアップ刺激への反応時間で測定します。
            ランダムな間隔（2〜10秒）で表示されるカウンターにできるだけ速く反応してください。
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-2">🎯 Flanker Task（フランカー課題）</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            抑制制御とノイズフィルタリング能力を、方向矢印の識別で測定します。
            5つの矢印のうち、中央の矢印の方向をできるだけ速く正確に判断してください。
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-2">📊 測定指標</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 pr-4 text-[var(--muted-foreground)]">タスク</th>
                  <th className="text-left py-2 text-[var(--muted-foreground)]">計測指標</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 pr-4">PVT</td>
                  <td className="py-2">平均反応時間、Minor/Major Lapse数、最遅10%平均</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Flanker</td>
                  <td className="py-2">正答率、干渉効果、反応時間標準偏差</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
