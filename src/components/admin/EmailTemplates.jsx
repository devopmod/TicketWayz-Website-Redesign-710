import React from 'react';
import { motion } from 'framer-motion';
import EmailTemplateEditor from './EmailTemplateEditor';

const EmailTemplates = ({ settings, onChange }) => {
  const handleTemplateChange = (key, template) => {
    onChange({
      ...settings,
      [key]: template
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Подтверждение покупки
        </h3>
        <EmailTemplateEditor
          template={settings.purchaseConfirmation}
          onChange={(tpl) => handleTemplateChange('purchaseConfirmation', tpl)}
        />
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Напоминание о событии
        </h3>
        <EmailTemplateEditor
          template={settings.eventReminder}
          onChange={(tpl) => handleTemplateChange('eventReminder', tpl)}
        />
      </div>
    </motion.div>
  );
};

export default EmailTemplates;
