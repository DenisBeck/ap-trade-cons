import { Flex, Select, Input, InputNumber } from 'antd';
import { Kind } from './page';

export default function InputSection(props: any) {

  return (
    <Flex gap={20} no-wrap='true' justify='center' align='center'>
      <Input 
        value={props.item.dockName}
        onChange={(event) => props.onChange(event, 'dockName')}
        style={{ maxWidth: 300 }}
        placeholder='Номер дока' 
        />
      <Select
        placeholder='Отрасль'
        value={props.item.kind}
        onChange={(event) => props.onChange(event, 'kind')}
        style={{ width: 120 }}
        options={[
            { value: Kind.PRODUCTS, label: 'ПН' },
            { value: Kind.BB, label: 'ББ' },
            { value: Kind.PEP, label: 'Пепси' },
        ]}
        />
      <InputNumber<string>
        value={props.item.picksNumber}
        onChange={(event) => props.onChange(event, 'picksNumber')}
        style={{ width: 300 }}
        placeholder='Количество пиков'
        min="0"
        max="100"
        stringMode
        />
      <InputNumber<string>
        value={props.item.weight}
        onChange={(event) => props.onChange(event, 'weight')}
        style={{ width: 300 }}
        placeholder='Вес'
        min="0"
        max="40000"
        stringMode
        />
    </Flex>
  );
}
