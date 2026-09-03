import { useEffect, useState } from 'react';

import { Button, type ButtonVariant } from '@shared/components/button/Button';
import { CodeInput } from '@shared/components/form/CodeInput';
import { Checkbox } from '@shared/components/form/Checkbox';
import { EmailInput } from '@shared/components/form/EmailInput';
import { FormActions } from '@shared/components/form/FormActions';
import { FormRow } from '@shared/components/form/FormRow';
import { FormSection } from '@shared/components/form/FormSection';
import { PasswordInput } from '@shared/components/form/PasswordInput';
import { Radio } from '@shared/components/form/Radio';
import { RadioGroup } from '@shared/components/form/RadioGroup';
import { SearchField } from '@shared/components/form/SearchField';
import { Select } from '@shared/components/form/Select';
import { Switch } from '@shared/components/form/Switch';
import { TextArea } from '@shared/components/form/TextArea';
import { TextInput } from '@shared/components/form/TextInput';
import { useT } from '@shared/i18n';
import { lightTheme, type SemanticColorAliases, type TypeStep } from '@shared/theme';

import { contrastMap } from './contrastMap';
import styles from './TokensPage.module.css';

const COLOR_ALIASES: { key: keyof SemanticColorAliases; cssVar: string }[] = [
  { key: 'action', cssVar: '--color-action' },
  { key: 'actionHover', cssVar: '--color-action-hover' },
  { key: 'actionSubtle', cssVar: '--color-action-subtle' },
  { key: 'textStrong', cssVar: '--color-text-strong' },
  { key: 'textDefault', cssVar: '--color-text-default' },
  { key: 'textMuted', cssVar: '--color-text-muted' },
  { key: 'textDisabled', cssVar: '--color-text-disabled' },
  { key: 'borderInput', cssVar: '--color-border-input' },
  { key: 'borderSubtle', cssVar: '--color-border-subtle' },
  { key: 'surface', cssVar: '--color-surface' },
  { key: 'surfaceSunken', cssVar: '--color-surface-sunken' },
  { key: 'surfaceDisabled', cssVar: '--color-surface-disabled' },
  { key: 'success', cssVar: '--color-success' },
  { key: 'successBg', cssVar: '--color-success-bg' },
  { key: 'warning', cssVar: '--color-warning' },
  { key: 'warningBg', cssVar: '--color-warning-bg' },
  { key: 'danger', cssVar: '--color-danger' },
  { key: 'dangerBg', cssVar: '--color-danger-bg' },
  { key: 'dangerSolid', cssVar: '--color-danger-solid' },
];

const SPACING_VARS = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7', '--space-8', '--space-9', '--space-10'];
const RADIUS_VARS = ['--radius-sm', '--radius-md', '--radius-lg', '--radius-full'];
const SHADOW_VARS = ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg'];
const TYPE_STEPS: (keyof TypeStep)[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'];
const MOTION_VARS = ['--duration-fast', '--duration-base', '--ease-out'];

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger', 'danger-subtle', 'link'];
const BUTTON_SIZES: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
const GUIDANCE_ROWS = [
  'pageHeader',
  'tableRow',
  'formFooter',
  'confirmationDialog',
  'emptyState',
  'detailPageHeader',
] as const;

/** Reads the *resolved* value from `<html>` — never a hard-coded literal, so this always reflects the live theme. */
function useResolvedVar(name: string): string {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  }, [name]);
  return value;
}

function ColorRow({ alias, cssVar }: { alias: keyof SemanticColorAliases; cssVar: string }) {
  const { t } = useT();
  const resolved = useResolvedVar(cssVar);
  return (
    <tr>
      <td>
        <span className={styles.swatch} style={{ background: `var(${cssVar})` }} aria-hidden="true" />
      </td>
      <td>
        <code>{cssVar}</code>
      </td>
      <td>{resolved}</td>
      <td>{t(`designSystem.color.${alias}`)}</td>
      <td>{contrastMap[alias]}</td>
    </tr>
  );
}

function SpacingRow({ cssVar }: { cssVar: string }) {
  const resolved = useResolvedVar(cssVar);
  return (
    <div className={styles.spacingRow}>
      <code>{cssVar}</code>
      <span className={styles.spacingBar} style={{ width: `var(${cssVar})` }} aria-hidden="true" />
      <span>{resolved}</span>
    </div>
  );
}

function ButtonsSection() {
  const { t } = useT();

  return (
    <section data-testid="ds-button-section">
      <h2>{t('designSystem.button.title')}</h2>

      <div className={styles.buttonGrid}>
        {BUTTON_VARIANTS.map((variant) => (
          <div key={variant} className={styles.buttonRow}>
            <span>{t(`designSystem.button.variants.${variant}`)}</span>
            {BUTTON_SIZES.map((size) => (
              <span key={size} className={styles.buttonSample}>
                <Button variant={variant} size={size}>
                  {t(`designSystem.button.sizes.${size}`)}
                </Button>
              </span>
            ))}
          </div>
        ))}
      </div>

      <h3>{t('designSystem.button.states.default')}</h3>
      <div className={styles.buttonSample}>
        <Button variant="primary">{t('designSystem.button.states.default')}</Button>
      </div>

      <h3>{t('designSystem.button.states.focusVisible')}</h3>
      <div className={styles.buttonSample}>
        <Button variant="primary">{t('designSystem.button.states.focusVisible')}</Button>
      </div>

      <h3>{t('designSystem.button.states.active')}</h3>
      <p className={styles.typeSampleLatin}>{t('designSystem.button.states.hover')}</p>

      <h3>{t('designSystem.button.states.loading')}</h3>
      <div className={styles.buttonSample}>
        <Button variant="primary" loading>
          {t('designSystem.button.states.loading')}
        </Button>
      </div>

      <h3>{t('designSystem.button.states.disabled')}</h3>
      <div className={styles.buttonSample}>
        <Button variant="primary" disabled>
          {t('designSystem.button.states.disabled')}
        </Button>
      </div>

      <h3>{t('designSystem.button.states.disabledWithReason')}</h3>
      <div className={styles.buttonSample}>
        <Button variant="danger-subtle" disabled disabledReason={t('admin.common.actions.reason.cannotDeleteSelf')}>
          {t('designSystem.button.states.disabledWithReason')}
        </Button>
      </div>

      <h3>{t('designSystem.button.states.iconOnly')}</h3>
      <div className={styles.buttonSample}>
        <Button variant="tertiary" iconOnly aria-label={t('common.moreActions')}>
          ⋯
        </Button>
      </div>

      <h3>{t('designSystem.button.guidance.title')}</h3>
      <table>
        <thead>
          <tr>
            <th>{t('designSystem.button.guidance.columns.context')}</th>
            <th>{t('designSystem.button.guidance.columns.use')}</th>
            <th>{t('designSystem.button.guidance.columns.avoid')}</th>
          </tr>
        </thead>
        <tbody>
          {GUIDANCE_ROWS.map((row) => (
            <tr key={row}>
              <td>{t(`designSystem.button.guidance.rows.${row}.context`)}</td>
              <td>{t(`designSystem.button.guidance.rows.${row}.use`)}</td>
              <td>{t(`designSystem.button.guidance.rows.${row}.avoid`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const PLANNED_CONTROLS = ['combobox', 'multiSelect', 'datePicker'] as const;

function FormsSection() {
  const { t } = useT();
  const [search, setSearch] = useState('acme');
  const [switchOn, setSwitchOn] = useState(true);
  const [radioValue, setRadioValue] = useState('basic');

  return (
    <section data-testid="ds-forms-section">
      <h2>{t('designSystem.forms.title')}</h2>

      <FormSection title={t('designSystem.forms.controls.textInput')}>
        <FormRow columns={2}>
          <TextInput label={t('designSystem.forms.controls.textInput')} placeholder="jane@example.com" />
          <TextInput
            label={`${t('designSystem.forms.controls.textInput')} — ${t('designSystem.forms.states.filled')}`}
            value="Jane Doe"
            onChange={() => {}}
          />
        </FormRow>
        <FormRow columns={2}>
          <TextInput
            label={`${t('designSystem.forms.controls.textInput')} — ${t('designSystem.forms.states.disabled')}`}
            disabled
            value="Cannot edit"
            onChange={() => {}}
          />
          <TextInput
            label={`${t('designSystem.forms.controls.textInput')} — ${t('designSystem.forms.states.readOnly')}`}
            readOnly
            value="Read only"
            onChange={() => {}}
          />
        </FormRow>
        <TextInput
          label={`${t('designSystem.forms.controls.textInput')} — ${t('designSystem.forms.states.error')}`}
          value=""
          onChange={() => {}}
          error={t('validation.required')}
        />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.textArea')}>
        <TextArea label={t('designSystem.forms.controls.textArea')} placeholder="Add a note…" />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.passwordInput')}>
        <PasswordInput label={t('designSystem.forms.controls.passwordInput')} value="" onChange={() => {}} />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.emailInput')}>
        <EmailInput label={t('designSystem.forms.controls.emailInput')} value="" onChange={() => {}} />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.codeInput')}>
        <CodeInput label={t('designSystem.forms.controls.codeInput')} value="" onChange={() => {}} />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.searchField')}>
        <SearchField
          label={t('designSystem.forms.controls.searchField')}
          value={search}
          onChange={setSearch}
        />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.select')}>
        <Select
          label={t('designSystem.forms.controls.select')}
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
          defaultValue="a"
        />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.checkbox')}>
        <Checkbox label={t('designSystem.forms.controls.checkbox')} hint="Optional helper text" />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.radio')}>
        <Radio name="ds-radio-demo" label={t('designSystem.forms.controls.radio')} defaultChecked />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.radioGroup')}>
        <RadioGroup
          name="ds-radio-group-demo"
          label={t('designSystem.forms.controls.radioGroup')}
          value={radioValue}
          onChange={setRadioValue}
          options={[
            { value: 'basic', label: 'Basic' },
            { value: 'pro', label: 'Pro' },
          ]}
        />
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.switch')}>
        <Switch
          label={`${t('designSystem.forms.controls.switch')} (${switchOn ? t('forms.switch.on') : t('forms.switch.off')})`}
          checked={switchOn}
          onChange={(event) => setSwitchOn(event.target.checked)}
        />
      </FormSection>

      <FormSection
        title={t('designSystem.forms.controls.formRow')}
        description={t('designSystem.forms.controls.formSection')}
      >
        <FormRow columns={2}>
          <TextInput label="First name" />
          <TextInput label="Last name" />
        </FormRow>
      </FormSection>

      <FormSection title={t('designSystem.forms.controls.formActions')}>
        <FormActions align="stretch">
          <Button variant="primary" size="lg" fullWidth>
            {t('designSystem.forms.controls.formActions')}
          </Button>
        </FormActions>
      </FormSection>

      <h3>{t('designSystem.forms.planned.title')}</h3>
      <table>
        <tbody>
          {PLANNED_CONTROLS.map((control) => (
            <tr key={control}>
              <td>{t(`designSystem.forms.planned.${control}`)}</td>
              <td>{t('designSystem.forms.planned.note')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function TokensPage() {
  const { t } = useT();

  return (
    <main className={styles.page}>
      <h1>{t('designSystem.title')}</h1>

      <section>
        <h2>{t('designSystem.sections.colors')}</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{t('designSystem.columns.token')}</th>
              <th>{t('designSystem.columns.value')}</th>
              <th>{t('designSystem.columns.use')}</th>
              <th>{t('designSystem.columns.contrast')}</th>
            </tr>
          </thead>
          <tbody>
            {COLOR_ALIASES.map(({ key, cssVar }) => (
              <ColorRow key={key} alias={key} cssVar={cssVar} />
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>{t('designSystem.sections.spacing')}</h2>
        {SPACING_VARS.map((cssVar) => (
          <SpacingRow key={cssVar} cssVar={cssVar} />
        ))}
      </section>

      <section>
        <h2>{t('designSystem.sections.radii')}</h2>
        {RADIUS_VARS.map((cssVar) => (
          <div key={cssVar} className={styles.radiusRow}>
            <span className={styles.radiusSwatch} style={{ borderRadius: `var(${cssVar})` }} aria-hidden="true" />
            <code>{cssVar}</code>
          </div>
        ))}
      </section>

      <section>
        <h2>{t('designSystem.sections.shadows')}</h2>
        {SHADOW_VARS.map((cssVar) => (
          <div key={cssVar} className={styles.shadowRow}>
            <span className={styles.shadowSwatch} style={{ boxShadow: `var(${cssVar})` }} aria-hidden="true" />
            <code>{cssVar}</code>
          </div>
        ))}
      </section>

      <section>
        <h2>{t('designSystem.sections.typography')}</h2>
        {TYPE_STEPS.map((step) => (
          <div key={step} className={styles.typeRow}>
            <code>
              --text-{step} ({lightTheme.typography.size[step]})
            </code>
            <p
              className={styles.typeSampleLatin}
              style={{ fontSize: `var(--text-${step})`, lineHeight: `var(--line-height-${step}-latin)` }}
            >
              {t('designSystem.typographySample')}
            </p>
            <p
              className={styles.typeSampleArabic}
              dir="rtl"
              style={{ fontSize: `var(--text-${step})`, lineHeight: `var(--line-height-${step}-arabic)` }}
            >
              {t('designSystem.typographySample')}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2>{t('designSystem.sections.motion')}</h2>
        {MOTION_VARS.map((cssVar) => (
          <code key={cssVar} className={styles.motionToken}>
            {cssVar}
          </code>
        ))}
        <button type="button" className={styles.motionDemo}>
          {t('designSystem.motionDemo')}
        </button>
      </section>

      <ButtonsSection />
      <FormsSection />
    </main>
  );
}
