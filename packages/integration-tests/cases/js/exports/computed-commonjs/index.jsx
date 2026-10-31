const EXPORT_NAME = 'exports';

function ComputedCommonJs() {
  return <div />;
}

module[EXPORT_NAME] = ComputedCommonJs;
