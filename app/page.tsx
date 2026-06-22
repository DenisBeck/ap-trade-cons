"use client";
import { Button, Flex, InputNumber, Tag, Typography } from 'antd';

import { Suspense, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import InputSection from './inputSection';
import DraggableTag from './draggableTag';
import Droppable from './droppable';
import {
  defaultDropAnimation,
  DndContext,
  type DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export enum Kind {
  PEP,
  PRODUCTS,
  BB
}

enum Sorting {
  BYPICKS,
  BYWEIGHT,
  BYSALARY
}

interface InputSection {
  id: number,
  dockName: string,
  kind: Kind,
  picksNumber: number,
  weight: number,
  salary: number
}

interface Tarif {
  picks: number,
  pepWeight: number,
  prodWeight: number
}

interface WorkerJob {
  id: number,
  picks: number,
  pepWeight: number,
  notPepWeight: number,
  salary: number,
  docks: InputSection[]
}

const tarifData: Tarif = {
  picks: 24.7, 
  pepWeight: 0.22, 
  prodWeight: 0.55
}

const sensorSettings = {
  distance: 2,
};

const docksData: InputSection[] = [
  { id: 1, dockName: '29', kind: Kind.PRODUCTS, picksNumber: 12, weight: 108.87, salary: 0 },
  { id: 2, dockName: '29', kind: Kind.BB, picksNumber: 1, weight: 0.31, salary: 0 },
  { id: 3, dockName: '13', kind: Kind.PRODUCTS, picksNumber: 46, weight: 749.32, salary: 0 },
  { id: 4, dockName: '13', kind: Kind.BB, picksNumber: 18, weight: 348.48, salary: 0 },
  { id: 5, dockName: '27', kind: Kind.BB, picksNumber: 4, weight: 564.7, salary: 0 },
  { id: 6, dockName: '12', kind: Kind.BB, picksNumber: 17, weight: 120.28, salary: 0 },
  { id: 7, dockName: '20', kind: Kind.BB, picksNumber: 3, weight: 12.8, salary: 0 },
  { id: 8, dockName: '11', kind: Kind.BB, picksNumber: 6, weight: 76.59, salary: 0 },
  { id: 9, dockName: '11', kind: Kind.PRODUCTS, picksNumber: 16, weight: 750.14, salary: 0 },
  { id: 10, dockName: '16', kind: Kind.PRODUCTS, picksNumber: 15, weight: 246.47, salary: 0 },
  { id: 11, dockName: '16', kind: Kind.BB, picksNumber: 7, weight: 894.36, salary: 0 },
  { id: 12, dockName: '31', kind: Kind.BB, picksNumber: 5, weight: 47.7, salary: 0 },
  { id: 13, dockName: '31', kind: Kind.PRODUCTS, picksNumber: 24, weight: 300.57, salary: 0 },
  { id: 14, dockName: '15', kind: Kind.BB, picksNumber: 19, weight: 158.04, salary: 0 },
  { id: 15, dockName: '15', kind: Kind.PRODUCTS, picksNumber: 25, weight: 352.54, salary: 0 },
]

function getJobs(arr: InputSection[], n: number, sorting = Sorting.BYSALARY): WorkerJob[] {
    if (n <= 0) return [];
    
    // Создаем массив из n пустых групп и объект для отслеживания их сумм
    const workerJobs: WorkerJob[] = [];
    const groups: InputSection[][] = Array.from({ length: n }, () => []);
    const groupSums = new Array(n).fill(0);

    // Сортируем копию массива по убыванию, чтобы большие числа распределялись первыми
    const sortedArr: InputSection[] = [...arr].sort((a, b) => sorting === Sorting.BYPICKS ? b.picksNumber - a.picksNumber : sorting === Sorting.BYWEIGHT ? b.weight - a.weight : b.salary - a.salary);

    // Распределяем элементы
    for (let item of sortedArr) {
      // Находим индекс группы с наименьшей суммой с помощью метода indexOf 
      // в комбинации с Math.min для массива сумм
      const minSumIndex = groupSums.indexOf(Math.min(...groupSums));
      
      // Добавляем число в эту группу
      groups[minSumIndex].push(item);
      if (workerJobs.length === 0) {
        workerJobs.push({
          id: minSumIndex,
          pepWeight: item.kind === Kind.PEP ? item.weight : 0,
          notPepWeight: item.kind !== Kind.PEP ? item.weight : 0,
          picks: item.picksNumber,
          salary: item.salary,
          docks: [item],
        })
      } else {
        const workerJobItem = workerJobs.find(item => item.id === minSumIndex);
        if (workerJobItem) {
          workerJobItem.docks.push(item);
          workerJobItem.picks += item.picksNumber;
          workerJobItem.pepWeight += item.kind === Kind.PEP ? item.weight : 0;
          workerJobItem.notPepWeight += item.kind !== Kind.PEP ? item.weight : 0;
          workerJobItem.salary += item.salary;
        } else {
          workerJobs.push({
            id: minSumIndex,
            pepWeight: item.kind === Kind.PEP ? item.weight : 0,
            notPepWeight: item.kind !== Kind.PEP ? item.weight : 0,
            picks: item.picksNumber,
            salary: item.salary,
            docks: [item],
          })
        }
      } 
      // Обновляем сумму для выбранной группы
      groupSums[minSumIndex] += sorting === Sorting.BYPICKS ? item.picksNumber : sorting === Sorting.BYWEIGHT ? item.weight : item.salary;
    }

    // return {
    //     groups,
    //     sums: groupSums
    // };
    return workerJobs;
}

function inputSectionsReducer(inputSections: InputSection[], action: any): InputSection[] {
  switch (action.type) {
    case 'addSection': {
      return [...inputSections, {
        id: action.id,
        dockName: action.dockName || '',
        kind: action.kind,
        picksNumber: action.picksNumber,
        weight: action.weight,
        salary: 0
      }];
    }
    case 'deleteSection': {
      return inputSections.filter((s: any) => s.id !== action.id);
    }
    case 'changeDockName': {
      return inputSections.map((s: any) => {
        if (s.id === action.id) {
          s.dockName = action.dockName;
        }
        return s;
      });
    }
    case 'changeKind': {
      return inputSections.map((s: any) => {
        if (s.id === action.id) {
          s.kind = action.kind;
        }
        return s;
      });
    }
    case 'changePicksNumber': {
      return inputSections.map((s: any) => {
        if (s.id === action.id) {
          s.picksNumber = action.picksNumber;
        }
        return s;
      });
    }
    case 'changeWeight': {
      return inputSections.map((s: any) => {
        if (s.id === action.id) {
          s.weight = action.weight;
        }
        return s;
      });
    }
    default:
      return inputSections;
  }
}

export default function Home() {
  const [workersNumber, setWorkersNumber] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tarif, setTarif] = useState<Tarif>(tarifData)
  const [inputSections, setInputSections] = useReducer(inputSectionsReducer, docksData);
  const [averageSum, setAverageSum] = useState<number>(0);
  const [averageWeight, setAverageWeight] = useState<number>(0);
  const [averagePicks, setAveragePicks] = useState<number>(0);
  const [workerJobs, setWorkerJobs] = useState<WorkerJob[]>([]);
  const [activeDndItemId, setActiveDndItemId] = useState<null | number>(null);
  const [sorting, setSorting] = useState<Sorting>(Sorting.BYPICKS);

  const bottomRef = useRef(null);

  useEffect(() => {
    handleScrollBottom();
  }, [workerJobs]);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: sensorSettings,
    }),
    useSensor(PointerSensor, {
      activationConstraint: sensorSettings,
    })
  );

  function onInputSectionChange(event: any, key: string, id: number): void {
    setAverageSum(0);
    setAveragePicks(0);
    setAverageWeight(0);
    setIsError(false);
    switch (key) {
      case 'dockName': setInputSections({
          type: 'changeDockName',
          id: id,
          dockName: event.target.value
        });
        break;
      case 'kind': setInputSections({
          type: 'changeKind',
          id: id,
          kind: event
        });
        break;
      case 'picksNumber': setInputSections({
          type: 'changePicksNumber',
          id: id,
          picksNumber: Number(event)
        });
        break;
      case 'weight': setInputSections({
          type: 'changeWeight',
          id: id,
          weight: Number(event)
        });
        break;
    }
  }

  function addInputSection(): void {
    setAverageSum(0);
    setAveragePicks(0);
    setAverageWeight(0);
    setIsError(false);
    setInputSections({
      type: 'addSection',
      id: Math.random()
    });
  }

  function removeInputSection(id: number): void {
    setAverageSum(0);
    setAveragePicks(0);
    setAverageWeight(0);
    setIsError(false);
    setInputSections({
      type: 'deleteSection',
      id: id
    })
  }

  function changeWorkersNumber(num: number):void {
    setAverageSum(0);
    setAveragePicks(0);
    setAverageWeight(0);
    setIsError(false);
    setWorkersNumber(num);
  }

  function divideDocks(by: Sorting = sorting): void {
    if (by !== sorting) setSorting(by);
    setAverageSum(0);
    setAveragePicks(0);
    setAverageWeight(0);
    setIsError(false);

    if (!inputSections.length) {
      setWorkerJobs([]);
      setIsError(true);
      setErrorMessage('Не указано ни одного дока');
      return;
    }
    if (!workersNumber) {
      setWorkerJobs([]);
      setIsError(true);
      setErrorMessage('Не указано число работников');
      return;
    }
    if (!tarif.picks || !tarif.prodWeight || !tarif.pepWeight) {
      setWorkerJobs([]);
      setIsError(true);
      setErrorMessage('Не указаны данные о тарифах');
      return;
    }

    for (let item of inputSections) {
      const weightSum = item.kind === Kind.PEP ? (item.weight * tarif.pepWeight) : (item.weight * tarif.prodWeight);
      const salary = weightSum + item.picksNumber * tarif.picks;
      item.salary = salary;
    }

    setAverageSum(() => inputSections.reduce((sum, item) => sum + item.salary, 0) / workersNumber);
    setAveragePicks(() => inputSections.reduce((sum, item) => sum + item.picksNumber, 0) / workersNumber);
    setAverageWeight(() => inputSections.reduce((sum, item) => {
      sum += item.weight;
      console.log(sum);
      return sum;
    }, 0) / workersNumber);

    setWorkerJobs(() => getJobs(inputSections, workersNumber, by));
    
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDndItemId(active.id as number);
  };

  const handleDragEnd = ({ over }: DragOverEvent) => {
    if (typeof activeDndItemId !== 'number') return;
    const overTagId = over?.id as number;
    const activeItem = inputSections.find(item => item.id === activeDndItemId);


    const activeRowId = workerJobs.find(
      (item) => item.docks.map(i => i.id).includes(activeDndItemId)
    )?.id;
    const overRowId = workerJobs.find(
      (item) => item.id === overTagId
    )?.id;
    if (!activeItem || 
      typeof overRowId !== 'number' || 
      typeof activeRowId !== 'number' ||
      activeRowId === overRowId) return;
    
    setWorkerJobs((jobs) => {
      const updatedJob1 = jobs.find(item => item.id === activeRowId);
      if (updatedJob1) {
        updatedJob1.docks = updatedJob1?.docks.filter(item => item.id != activeDndItemId) || [];
        updatedJob1.salary = updatedJob1.docks.reduce((sum, item) => sum + item.salary, 0);
        updatedJob1.picks = updatedJob1.docks.reduce((sum, item) => sum + item.picksNumber, 0);
        updatedJob1.pepWeight = updatedJob1.docks.reduce((sum, item) => sum + item.kind === Kind.PEP ? item.salary : 0, 0);
        updatedJob1.notPepWeight = updatedJob1.docks.reduce((sum, item) => sum + item.kind !== Kind.PEP ? item.salary : 0, 0);
        
      }
      
      const updatedJob2 = jobs.find(item => item.id === overRowId);
      if (updatedJob2) {
        if(!updatedJob2.docks.includes(activeItem)) {
          updatedJob2.docks.push(activeItem);
        }
        updatedJob2.salary = updatedJob2.docks.reduce((sum, item) => sum + item.salary, 0);
        updatedJob2.picks = updatedJob2.docks.reduce((sum, item) => sum + item.picksNumber, 0);
        updatedJob2.pepWeight = updatedJob2.docks.reduce((sum, item) => sum + item.kind === Kind.PEP ? item.salary : 0, 0);
        updatedJob2.notPepWeight = updatedJob2.docks.reduce((sum, item) => sum + item.kind !== Kind.PEP ? item.salary : 0, 0);
        
      }
      if (updatedJob1 && updatedJob2) {
        return [...jobs.filter(item => (item.id !== overRowId && item.id !== activeRowId)), updatedJob1, updatedJob2].toSorted((a, b) => a.id - b.id);
      }
      return jobs;
    })
    setActiveDndItemId(null);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const activeTagId = active.id as number;
    const overTagId = over?.id as number;
    const activeRowId = workerJobs.find(
      (item) => item.docks.map(i => i.id).includes(activeTagId)
    )?.id;
    const overRowId = workerJobs.find(
      (item) => item.id === overTagId
    )?.id;

    if (
      !activeDndItemId ||
      !activeRowId ||
      !overRowId ||
      activeRowId === overRowId
    ) {
      return;
    }
  };

  const handleScrollBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth' // Плавная прокрутка
    });
  };

  const overlayItem = useMemo(() => {
    return inputSections.find((item) => item.id === activeDndItemId);
  }, [activeDndItemId, inputSections]);

  return (
    <Suspense fallback='Загрузка...'>
      <Flex 
        gap={20} 
        style={{margin: 20}} 
        wrap 
        justify='center' 
        align='center' 
        vertical>

        {inputSections.map((item: InputSection) => (
          <Flex gap={20} no-wrap='true' justify='center' align='center' key={item.id}>
            <InputSection item={item} onChange={(event: any, key: string) => onInputSectionChange(event, key, item.id)} />
            <Button danger onClick={() => removeInputSection(item.id)}>Удалить</Button>
          </Flex>
          
        ))}
        
        <Flex gap="small" wrap justify='flex-end' align='center'>
          <Button type="primary" onClick={addInputSection}>Добавить док</Button>
        </Flex>

        <Flex gap={20} no-wrap='true' justify='space-between' align='flex-start' vertical>

          <Flex gap={20} no-wrap='true' justify='flex-start' align='center'>
            <Typography.Text>Количество работников</Typography.Text>
            <InputNumber<number>
              onFocus={() => setIsError(false)}
              onChange={(v) => changeWorkersNumber(Number(v) || 0)}
              style={{ width: 300 }}
            />
          </Flex>
          <Flex gap={20} no-wrap='true' justify='flex-end' align='flex-end'>
            <Typography.Text>Стоимость пикинга</Typography.Text>
            <InputNumber<number>
              value={tarif.picks}
              onFocus={() => setIsError(false)}
              onChange={(v) => setTarif(s => {return {...s, picks: Number(v) || 0} })}
              style={{ width: 300 }}
            />
          </Flex>
          <Flex gap={20} no-wrap='true' justify='center' align='center'>
            <Typography.Text>Стоимость веса ПН и ББ</Typography.Text>
            <InputNumber<number>
              value={tarif.prodWeight}
              onFocus={() => setIsError(false)}
              onChange={(v) => setTarif(s => {return {...s, prodWeight: Number(v) || 0} })}
              style={{ width: 300 }}
            />
          </Flex>
          <Flex gap={20} no-wrap='true' justify='center' align='center'>
            <Typography.Text>Стоимость веса Пепси</Typography.Text>
            <InputNumber<number>
              value={tarif.pepWeight}
              onFocus={() => setIsError(false)}
              onChange={(v) => setTarif(s => {return {...s, pepWeight: Number(v) || 0} })}
              style={{ width: 300 }}
            />
          </Flex>

        </Flex>
        

        <Flex gap="small" no-wrap='true' justify='flex-end' align='center'>
          <Button type="primary" onClick={() => divideDocks(Sorting.BYPICKS)}>Поделить доки по пикам</Button>
          <Button type="primary" onClick={() => divideDocks(Sorting.BYWEIGHT)}>Поделить доки по весу</Button>
          <Button type="primary" onClick={() => divideDocks(Sorting.BYSALARY)}>Поделить доки по зарплате</Button>
        </Flex>

        <Flex gap="small" no-wrap='true' justify='flex-end' align='center'>
          {isError && <Typography.Text type="danger">{errorMessage}</Typography.Text>}
          {averagePicks > 0 && <div>Пики на каждого: {Math.round(averagePicks)}</div>}
          {averageWeight > 0 && <div>Вес на каждого: {Math.round(averageWeight)}кг</div>}
          {averageSum > 0 && <div>Сумма на каждого: {Math.round(averageSum)}руб</div>}
        </Flex>

        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Flex gap="small" wrap justify='flex-end' vertical>
            {
              workerJobs.length > 0 && workerJobs.map(item => 
                <Droppable key={item.id} items={item.docks} id={item.id}>
                  <Flex gap="small" wrap justify='flex-start' align='center'>Доки: 
                    {item.docks.map(i => 
                      <DraggableTag key={i.id} id={i.id} dockName={i.dockName} kind={i.kind} />
                    )}
                    <Typography.Text>Всего пиков: {item.picks}</Typography.Text>
                    <Typography.Text>Общий вес: {(item.notPepWeight || 0 + item.pepWeight || 0).toFixed(2)}</Typography.Text>
                    <Typography.Text>Сумма, руб: {item.salary.toFixed(2)}</Typography.Text>
                  </Flex>
                </Droppable>)
            }
          </Flex>
          <DragOverlay dropAnimation={{ ...defaultDropAnimation }}>
            {overlayItem ? (
              <Tag
                variant='solid' 
                color={'#52c41a'}
                style={{
                  zIndex: 999,
                }}
              >
                {overlayItem.dockName + ' ' + (overlayItem.kind === Kind.BB ? 'ББ' : overlayItem.kind === Kind.PRODUCTS ? 'ПН' : 'PEP')}
              </Tag>
            ) : null}
          </DragOverlay>
        </DndContext>
        <div ref={bottomRef} style={{width: '100%', height: 1}}></div>
      </Flex>
    </Suspense>
    
    
  );
}
